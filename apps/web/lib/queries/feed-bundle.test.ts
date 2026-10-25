import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import { PostgrestClient } from "@supabase/postgrest-js";

const entries = new Map<string, { value: unknown }>();
const requests: {
  path: string;
  viewer: string | null;
  body: Record<string, unknown>;
}[] = [];
let viewer = "viewer-a";
let failure: { code: string; message: string; status: number } | null = null;
let failFallback = false;
const review = {
  id: "00000000-0000-4000-8000-000000000001",
  title: null,
  body: null,
  rating: 4,
  likes_count: 1,
  comments_count: 0,
  created_at: "2026-10-25T00:00:00Z",
  entities: {
    id: "fixture-track",
    provider: "deezer",
    provider_id: "42",
    type: "track",
    title: "Fixture track",
  },
  author: {
    id: "fixture-author",
    username: "fixture-listener",
    display_name: "Fixture listener",
  },
};
let rows: Record<string, unknown>[] = [];
function client(actor: string | null) {
  return new PostgrestClient("https://bundle.test/rest/v1", {
    retry: false,
    headers: actor ? { "x-fixture-viewer": actor } : {},
    fetch: async (input, init) => {
      const path = new URL(String(input)).pathname;
      const caller = new Headers(init?.headers).get("x-fixture-viewer");
      requests.push({
        path,
        viewer: caller,
        body: init?.body ? JSON.parse(String(init.body)) : {},
      });
      let data: unknown;
      let status = 200;
      if (path.endsWith("/get_recommended_feed_bundle")) {
        if (failure) {
          data = failure;
          status = failure.status;
        } else
          data = rows.map((row) => ({
            ...row,
            viewer_has_liked: caller === "viewer-a" && row.id === review.id,
            viewer_has_bookmarked:
              caller === "viewer-a" && row.id === review.id,
          }));
      } else if (path === "/rest/v1/reviews") {
        status = failFallback ? 503 : 200;
        data = failFallback
          ? { code: "TEST_UNAVAILABLE", message: "Isolated read failure" }
          : [review];
      } else if (path.endsWith("/get_viewer_review_collection_state")) {
        data = [
          {
            review_id: review.id,
            liked: caller === "viewer-a",
            bookmarked: caller === "viewer-a",
          },
        ];
      } else throw new Error("Unexpected origin call: " + path);
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    },
  });
}
const profiles = [
  {
    id: "active-fixture",
    username: "active-fixture",
    display_name: "Fixture listener",
    avatar_url: null,
  },
];
const stubs = {
  empty: {},
  perf: { measureServerTask: (_name: string, run: () => unknown) => run() },
  server: { supabaseServer: async () => client(viewer) },
  public: { supabasePublic: () => client(null) },
  follows: {
    getViewerFollowingIds: () => {
      throw new Error("For You must not load follows separately");
    },
  },
  profiles: { getRecentlyActiveProfiles: async () => profiles },
  analytics: {
    trackServerAnalyticsEvent: () => {
      throw new Error("Bundle failures must not write analytics");
    },
  },
};
const key = Symbol.for("kocteau.feed-bundle.test");
const modules = new Map([
  ["server-only", "empty"],
  ["@/lib/perf", "perf"],
  ["@/lib/supabase/server", "server"],
  ["@/lib/supabase/public", "public"],
  ["@/lib/queries/profile-follows", "follows"],
  ["@/lib/queries/profiles", "profiles"],
  ["@/lib/analytics/server", "analytics"],
]);
let feed: typeof import("./feed");
before(async () => {
  Object.defineProperty(globalThis, "AsyncLocalStorage", {
    value: AsyncLocalStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis, "__incrementalCache", {
    configurable: true,
    value: {
      generateSimpleCacheKey: async (value: string) => value,
      get: async (value: string) => entries.get(value) ?? null,
      set: async (value: string, data: unknown) => {
        entries.set(value, { value: data });
      },
    },
  });
  Object.defineProperty(globalThis, key, { value: stubs, configurable: true });
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const name = modules.get(specifier);
      return name
        ? { url: "bundle-test:" + name, shortCircuit: true }
        : nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (!url.startsWith("bundle-test:")) return nextLoad(url, context);
      return {
        format: "commonjs",
        shortCircuit: true,
        source:
          'module.exports = globalThis[Symbol.for("kocteau.feed-bundle.test")][' +
          JSON.stringify(url.slice("bundle-test:".length)) +
          "];",
      };
    },
  });
  try {
    feed = await import("./feed");
  } finally {
    hooks.deregister();
  }
});
after(() => {
  Reflect.deleteProperty(globalThis, key);
  Reflect.deleteProperty(globalThis, "__incrementalCache");
  Reflect.deleteProperty(globalThis, "AsyncLocalStorage");
});
beforeEach(() => {
  entries.clear();
  requests.length = 0;
  viewer = "viewer-a";
  failure = null;
  failFallback = false;
  rows = [
    {
      ...review,
      recommendation_score: "3.5",
      recommendation_reason: "taste_match",
    },
    {
      ...review,
      id: "00000000-0000-4000-8000-000000000002",
      recommendation_score: "2.5",
      recommendation_reason: "popular_recent",
    },
  ];
});
test("one authenticated call supplies bounded cards and flags without serializing private fields into public card data", async () => {
  const result = await feed.getFeedPageBundle(viewer, "for-you", { limit: 1 });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, "/rest/v1/rpc/get_recommended_feed_bundle");
  assert.deepEqual(Object.keys(requests[0].body), ["p_limit"]);
  assert.equal(result.feed.length, 1);
  assert.equal(result.feed[0].title, null);
  assert.equal(result.feed[0].body, null);
  assert.equal(result.feed[0].recommendation_score, 3.5);
  assert.deepEqual([...result.likedReviewIds], [review.id]);
  assert.deepEqual([...result.bookmarkedReviewIds], [review.id]);
  assert.equal(Object.hasOwn(result.feed[0], "viewer_has_liked"), false);
  assert.equal(Object.hasOwn(result.feed[0], "viewer_has_bookmarked"), false);
  assert.equal(entries.size, 0);
});
test("lookahead creates a deterministic cursor and sends it to the next RPC", async () => {
  const first = await feed.getFeedPageBundle(viewer, "for-you", { limit: 1 });
  assert.ok(first.nextCursor);
  const cursor = JSON.parse(
    Buffer.from(first.nextCursor, "base64url").toString(),
  );
  assert.deepEqual(cursor, {
    id: review.id,
    created_at: review.created_at,
    score: 3.5,
  });
  await feed.getFeedPageBundle(viewer, "for-you", {
    limit: 1,
    cursor: first.nextCursor,
  });
  assert.deepEqual(requests[1].body, {
    p_limit: 1,
    p_cursor_score: 3.5,
    p_cursor_created_at: review.created_at,
    p_cursor_id: review.id,
  });
});
test("account switching obtains each caller's flags without a shared private cache", async () => {
  const a = await feed.getFeedPageBundle(viewer, "for-you");
  viewer = "viewer-b";
  const b = await feed.getFeedPageBundle(viewer, "for-you");
  assert.deepEqual(a.feed, b.feed);
  assert.deepEqual([...a.likedReviewIds], [review.id]);
  assert.deepEqual([...b.likedReviewIds], []);
  assert.deepEqual([...b.bookmarkedReviewIds], []);
  assert.deepEqual(
    requests.map((r) => r.viewer),
    ["viewer-a", "viewer-b"],
  );
  assert.equal(entries.size, 0);
});
test("guests make no personalized origin calls and retain optional active profiles", async () => {
  const result = await feed.getFeedPageBundle(null, "for-you", {
    includeActiveUsers: true,
  });
  assert.deepEqual(result.feed, []);
  assert.deepEqual(result.activeUsers, profiles);
  assert.equal(requests.length, 0);
});
test("successful empty personalized results are not stored in the public cache", async () => {
  rows = [];
  assert.deepEqual((await feed.getFeedPageBundle(viewer, "for-you")).feed, []);
  rows = [
    {
      ...review,
      recommendation_score: 1,
      recommendation_reason: "popular_recent",
    },
  ];
  assert.equal(
    (await feed.getFeedPageBundle(viewer, "for-you")).feed.length,
    1,
  );
  assert.equal(requests.length, 2);
  assert.equal(entries.size, 0);
});
for (const error of [
  { code: "57014", message: "Statement timeout", status: 503 },
  { code: "42501", message: "Permission denied", status: 403 },
  { code: "42883", message: "Some other function does not exist", status: 404 },
])
  test(
    "unexpected RPC failure " + error.code + " rejects after one origin call",
    async (t) => {
      t.mock.method(console, "error", () => {});
      failure = error;
      await assert.rejects(feed.getFeedPageBundle(viewer, "for-you"));
      assert.equal(requests.length, 1);
      assert.equal(entries.size, 0);
    },
  );
for (const code of ["PGRST202", "42883"])
  test(
    "known missing bundle " +
      code +
      " uses the bounded Latest compatibility path",
    async (t) => {
      t.mock.method(console, "error", () => {});
      failure = {
        code,
        message: "Could not find function public.get_recommended_feed_bundle",
        status: 404,
      };
      const result = await feed.getFeedPageBundle(viewer, "for-you");
      assert.equal(result.view, "for-you");
      assert.equal(result.feed[0].id, review.id);
      assert.deepEqual([...result.likedReviewIds], [review.id]);
      assert.deepEqual(
        requests.map((r) => r.path),
        [
          "/rest/v1/rpc/get_recommended_feed_bundle",
          "/rest/v1/reviews",
          "/rest/v1/rpc/get_viewer_review_collection_state",
        ],
      );
    },
  );
test("a failed compatibility read rejects rather than returning a false empty feed", async (t) => {
  t.mock.method(console, "error", () => {});
  failure = {
    code: "PGRST202",
    message: "Missing get_recommended_feed_bundle",
    status: 404,
  };
  failFallback = true;
  await assert.rejects(feed.getFeedPageBundle(viewer, "for-you"));
  assert.equal(requests.length, 2);
  assert.equal(entries.size, 0);
});
test("the RPC input clamps requested page sizes to its documented budget", async () => {
  await feed.getFeedPageBundle(viewer, "for-you", { limit: 100 });
  await feed.getFeedPageBundle(viewer, "for-you", { limit: 0 });
  assert.deepEqual(
    requests.map((r) => r.body.p_limit),
    [30, 1],
  );
});
