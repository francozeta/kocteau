import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import { PostgrestClient } from "@supabase/postgrest-js";

const entries = new Map<string, { value: unknown }>();
let refresh = false;
let status = 200;
let rows: unknown = [];
const requests: URL[] = [];
const client = new PostgrestClient("https://reviews.test/rest/v1", {
  retry: false,
  fetch: async (input) => {
    requests.push(new URL(String(input)));
    return new Response(JSON.stringify(rows), {
      status, headers: { "Content-Type": "application/json" },
    });
  },
});
const stubs = {
  empty: {},
  perf: { measureServerTask: (_name: string, run: () => unknown) => run() },
  public: { supabasePublic: () => client },
  server: { supabaseServer: () => { throw new Error("Public reviews must not read a session"); } },
  follows: { getViewerFollowingIds: () => { throw new Error("Public reviews must not read follows"); } },
  profiles: { getRecentlyActiveProfiles: () => { throw new Error("Secondary profiles are disabled"); } },
  viewer: { getViewerReviewCollectionState: () => { throw new Error("Viewer state stays outside the public cache"); } },
  analytics: { trackServerAnalyticsEvent: () => { throw new Error("Public reads do not write analytics"); } },
};
const stubKey = Symbol.for("kocteau.feed-cache.test");
const modules = new Map([
  ["server-only", "empty"], ["@/lib/perf", "perf"],
  ["@/lib/supabase/public", "public"], ["@/lib/supabase/server", "server"],
  ["@/lib/queries/profile-follows", "follows"], ["@/lib/queries/profiles", "profiles"],
  ["@/lib/queries/viewer", "viewer"], ["@/lib/analytics/server", "analytics"],
]);
let feed: typeof import("./feed");

before(async () => {
  Object.defineProperty(globalThis, "AsyncLocalStorage", { value: AsyncLocalStorage, configurable: true });
  Object.defineProperty(globalThis, "__incrementalCache", {
    configurable: true,
    value: {
      generateSimpleCacheKey: async (key: string) => key,
      get: async (key: string) => {
        const entry = entries.get(key);
        return entry ? { ...entry, isStale: refresh } : null;
      },
      set: async (key: string, value: unknown) => { entries.set(key, { value }); },
    },
  });
  Object.defineProperty(globalThis, stubKey, { value: stubs, configurable: true });
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const name = modules.get(specifier);
      return name ? { url: "feed-test:" + name, shortCircuit: true } : nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (!url.startsWith("feed-test:")) return nextLoad(url, context);
      return {
        format: "commonjs", shortCircuit: true,
        source: 'module.exports = globalThis[Symbol.for("kocteau.feed-cache.test")][' + JSON.stringify(url.slice("feed-test:".length)) + "];",
      };
    },
  });
  try { feed = await import("./feed"); } finally { hooks.deregister(); }
});
after(() => {
  Reflect.deleteProperty(globalThis, stubKey);
  Reflect.deleteProperty(globalThis, "__incrementalCache");
  Reflect.deleteProperty(globalThis, "AsyncLocalStorage");
});
beforeEach(() => {
  entries.clear();
  requests.length = 0;
  refresh = false;
  status = 200;
  rows = [];
});
const options = { limit: 14, publicOnly: true, includeActiveUsers: false };
const review = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "A fixture listening note",
  body: "Synthetic review for an isolated cache regression.",
  rating: 4,
  likes_count: 2,
  comments_count: 1,
  created_at: "2026-10-23T00:00:00Z",
  entities: { id: "fixture-entity", title: "Fixture track", provider: "deezer", provider_id: "42", type: "track" },
  author: { id: "fixture-author", username: "fixture-listener", display_name: "Fixture listener" },
};
function failOrigin() {
  status = 503;
  rows = { code: "TEST_UNAVAILABLE", message: "Temporary fixture failure" };
}

test("a failed public review fill rejects without caching an empty feed, then recovers", async (t) => {
  t.mock.method(console, "error", () => {});
  failOrigin();
  await assert.rejects(feed.getFeedPage(options));
  assert.equal(entries.size, 0);
  status = 200;
  rows = [review];
  const recovered = await feed.getFeedPage(options);
  assert.equal(recovered.feed[0]?.id, review.id);
  assert.deepEqual(await feed.getFeedPage(options), recovered);
  assert.equal(requests.length, 2);
});

test("a failed public review refresh preserves the last successful cache entry", async (t) => {
  t.mock.method(console, "error", () => {});
  rows = [review];
  const previous = await feed.getFeedPage(options);
  refresh = true;
  failOrigin();
  await assert.rejects(feed.getFeedPage(options));
  refresh = false;
  assert.deepEqual(await feed.getFeedPage(options), previous);
  assert.equal(requests.length, 2);
});

test("a successful empty public review list remains cacheable", async () => {
  const empty = await feed.getFeedPage(options);
  assert.deepEqual(empty.feed, []);
  assert.equal(empty.nextCursor, null);
  assert.equal(entries.size, 1);
  rows = [review];
  assert.deepEqual(await feed.getFeedPage(options), empty);
  assert.equal(requests.length, 1);
});

test("public feed requests preserve bounded hydration and separate page sizes", async () => {
  rows = [review];
  await feed.getFeedPage(options);
  await feed.getFeedPage({ ...options, limit: 3 });
  await feed.getFeedPage(options);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].pathname, "/rest/v1/reviews");
  assert.equal(requests[0].searchParams.get("limit"), "29");
  assert.match(requests[0].searchParams.get("select") ?? "", /reviews_author_id_fkey/);
  assert.equal(requests[0].searchParams.get("order"), "created_at.desc,id.desc");
});
