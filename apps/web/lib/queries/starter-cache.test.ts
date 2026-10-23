import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { AsyncLocalStorage } from "node:async_hooks";
import { after, before, beforeEach, test } from "node:test";
import { PostgrestClient } from "@supabase/postgrest-js";

type CacheEntry = { value: unknown; isStale: boolean };
const entries = new Map<string, CacheEntry>();
const incrementalCache = {
  generateSimpleCacheKey: async (key: string) => key,
  get: async (key: string) => {
    const entry = entries.get(key);
    return entry ? { ...entry, isStale: refresh } : null;
  },
  set: async (key: string, value: unknown) => {
    entries.set(key, { value, isStale: false });
  },
};
const requests: URL[] = [];
let refresh = false;
let status = 200;
let rows: unknown = [];
const client = new PostgrestClient("https://starter.test/rest/v1", {
  retry: false,
  fetch: async (input) => {
    requests.push(new URL(String(input)));
    return new Response(JSON.stringify(rows), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },
});
const stubs = {
  empty: {},
  perf: { measureServerTask: (_name: string, run: () => unknown) => run() },
  public: { supabasePublic: () => client },
  server: { supabaseServer: () => { throw new Error("Public picks must not read a viewer session"); } },
};
const stubKey = Symbol.for("kocteau.starter-cache.test");
const modules = new Map([
  ["server-only", "empty"],
  ["@/lib/perf", "perf"],
  ["@/lib/supabase/public", "public"],
  ["@/lib/supabase/server", "server"],
]);
let starter: typeof import("./starter");

before(async () => {
  Object.defineProperty(globalThis, "AsyncLocalStorage", { value: AsyncLocalStorage, configurable: true });
  Object.defineProperty(globalThis, "__incrementalCache", { value: incrementalCache, configurable: true });
  Object.defineProperty(globalThis, stubKey, { value: stubs, configurable: true });
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const name = modules.get(specifier);
      return name
        ? { url: "starter-test:" + name, shortCircuit: true }
        : nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (!url.startsWith("starter-test:")) return nextLoad(url, context);
      const name = url.slice("starter-test:".length);
      return {
        format: "commonjs",
        source: 'module.exports = globalThis[Symbol.for("kocteau.starter-cache.test")][' + JSON.stringify(name) + "];",
        shortCircuit: true,
      };
    },
  });
  try {
    starter = await import("./starter");
  } finally {
    hooks.deregister();
  }
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
const options = { limit: 6, seed: "cache-fixture", contextKey: "search" };
const pick = {
  id: "starter-fixture",
  provider: "deezer",
  provider_id: "42",
  type: "track",
  title: "Fixture track",
  artist_name: "Fixture artist",
  cover_url: null,
  deezer_url: null,
  prompt: null,
  editorial_note: null,
  is_featured: true,
  sort_order: 0,
  created_at: "2026-10-23T00:00:00Z",
};

test("a failed initial fill stays retryable and successful picks are reused", async (t) => {
  t.mock.method(console, "error", () => {});
  status = 503;
  rows = { code: "TEST_UNAVAILABLE", message: "Temporary fixture failure" };
  assert.deepEqual(await starter.getPublicStarterTracks(options), []);
  assert.equal(entries.size, 0, "a failure must not become a cached empty catalog");
  assert.equal(requests.length, 1);

  status = 200;
  rows = [pick];
  const recovered = await starter.getPublicStarterTracks(options);
  assert.equal(recovered[0]?.provider_id, pick.provider_id);
  assert.equal(requests.length, 2);
  assert.deepEqual(await starter.getPublicStarterTracks(options), recovered);
  assert.equal(requests.length, 2, "a successful fill must remain reusable");
});

test("a failed refresh cannot replace previously cached picks", async (t) => {
  t.mock.method(console, "error", () => {});
  rows = [pick];
  const previous = await starter.getPublicStarterTracks(options);
  refresh = true;
  status = 503;
  rows = { code: "TEST_UNAVAILABLE", message: "Temporary refresh failure" };
  assert.deepEqual(await starter.getPublicStarterTracks(options), []);
  refresh = false;
  assert.deepEqual(await starter.getPublicStarterTracks(options), previous);
  assert.equal(requests.length, 2);
});

test("a successful empty catalog is cacheable", async () => {
  assert.deepEqual(await starter.getPublicStarterTracks(options), []);
  assert.equal(entries.size, 1);
  rows = [pick];
  assert.deepEqual(await starter.getPublicStarterTracks(options), []);
  assert.equal(requests.length, 1);
});

test("public cache keys separate contexts and retain the bounded query", async () => {
  rows = [pick];
  await starter.getPublicStarterTracks(options);
  await starter.getPublicStarterTracks({ ...options, contextKey: "home" });
  await starter.getPublicStarterTracks(options);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].searchParams.get("limit"), "72");
  assert.equal(requests[0].searchParams.get("is_active"), "eq.true");
});
