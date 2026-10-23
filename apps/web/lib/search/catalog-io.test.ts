import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import { createClient } from "@supabase/supabase-js";

const calls: URL[] = [];
const snapshots = new Map<string, { value: unknown; at: number }>();
let cacheEnabled = false;
const key = Symbol.for("kocteau.catalog-io.test");
const stubs = {
  empty: {},
  cache: {
    unstable_cache: (run: (...args: unknown[]) => Promise<unknown>, keys: string[]) =>
      async (...args: unknown[]) => {
        if (!cacheEnabled) return run(...args);
        const id = JSON.stringify([keys, args]);
        const saved = snapshots.get(id);
        const refresh = () => run(...args).then((value) => {
          snapshots.set(id, { value, at: Date.now() });
          return value;
        });
        if (!saved) return refresh();
        if (Date.now() - saved.at >= 60_000) void refresh().catch(() => {});
        return saved.value;
      },
  },
  perf: { measureServerTask: (_name: string, run: () => unknown) => run() },
};
let catalog: typeof import("./catalog");
let searchRoute: typeof import("../../app/api/search/route");
let legacySearchRoute: typeof import("../../app/api/deezer/search/route");
let publicClient: typeof import("../supabase/public");

before(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://catalog.test";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fixture";
  Object.defineProperty(globalThis, key, { value: stubs, configurable: true });
  const modules = new Map([["server-only", "empty"], ["next/cache", "cache"], ["@/lib/perf", "perf"]]);
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      const name = modules.get(specifier);
      return name ? { url: "catalog-test:" + name, shortCircuit: true } : next(specifier, context);
    },
    load(url, context, next) {
      if (!url.startsWith("catalog-test:")) return next(url, context);
      return {
        format: "commonjs",
        source: 'module.exports = globalThis[Symbol.for("kocteau.catalog-io.test")][' + JSON.stringify(url.slice(13)) + '];',
        shortCircuit: true,
      };
    },
  });
  try {
    catalog = await import("./catalog");
    searchRoute = await import("../../app/api/search/route");
    legacySearchRoute = await import("../../app/api/deezer/search/route");
    publicClient = await import("../supabase/public");
  } finally { hooks.deregister(); }
});
after(() => { Reflect.deleteProperty(globalThis, key); });
beforeEach(() => {
  calls.length = 0;
  snapshots.clear();
  cacheEnabled = false;
});
const row = {
  id: "00000000-0000-4000-8000-000000000001", provider: "deezer", provider_id: "951796",
  type: "track", title: "Sea, Swallow Me", artist_name: "Cocteau Twins",
  cover_url: null, deezer_url: null, genres: [],
};
function matched(input: RequestInfo | URL) {
  const url = new URL(String(input));
  calls.push(url);
  const rows = url.pathname.endsWith("/entities") && url.searchParams.get("type") === "eq.track" ? [row] : [];
  return Response.json(rows);
}

test("16 simultaneous casing variants share seven reads and preserve the same entity", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return matched(input);
  });
  const variants = Array.from({ length: 16 }, (_, i) =>
    [..."cocteau"].map((c, bit) => i & (1 << bit) ? c.toUpperCase() : c).join(""));
  const results = await Promise.all(variants.map((q) => catalog.searchCatalog(q, "all", "local")));
  assert.equal(calls.length, 7);
  for (const result of results) {
    assert.equal(result.results[0]?.entity_id, row.id);
    assert.equal(result.readiness.local, "fresh");
  }
});

test("the actual public client makes one attempt on 503 instead of SDK retries", async (t) => {
  let attempts = 0;
  t.mock.method(globalThis, "fetch", async () => {
    attempts++;
    return new Response("unavailable", { status: 503, headers: { "Retry-After": "0" } });
  });
  const control = createClient("https://catalog.test", "sb_publishable_fixture", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await control.from("entities").select("id");
  assert.ok(attempts > 1, "the pinned SDK must reproduce implicit retries");
  attempts = 0;
  const result = await publicClient.supabasePublic().from("entities").select("id");
  assert.equal(result.status, 503);
  assert.equal(attempts, 1);
});

test("a failed empty local lookup returns 502 with degraded readiness and recovers", async (t) => {
  cacheEnabled = true;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    calls.push(new URL(String(input)));
    return new Response("unavailable", { status: 503 });
  });
  const url = "https://kocteau.test/api/search?q=recovery-case&source=local";
  const failed = await searchRoute.GET(new Request(url));
  assert.equal(failed.status, 502);
  assert.equal(failed.headers.get("X-Kocteau-Search-Status"), "degraded");
  assert.equal(calls.length, 7);
  await searchRoute.GET(new Request(url));
  assert.equal(calls.length, 7, "backoff must prevent another burst");
  await new Promise((resolve) => setTimeout(resolve, 1_020));
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => matched(input));
  const recovered = await searchRoute.GET(new Request(url));
  assert.equal(recovered.status, 200);
  assert.equal(recovered.headers.get("X-Kocteau-Search-Status"), "fresh");
  assert.equal((await recovered.json())[0].entity_id, row.id);
});

test("expired cached success exposes stale then degraded background refresh state", async (t) => {
  cacheEnabled = true;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => matched(input));
  const q = "stale-case";
  await catalog.searchCatalog(q, "all", "local");
  const now = Date.now();
  t.mock.method(Date, "now", () => now + 61_000);
  t.mock.method(globalThis, "fetch", async () => new Response("unavailable", { status: 503 }));
  const stale = await catalog.searchCatalog(q, "all", "local");
  assert.equal(stale.readiness.local, "stale");
  await new Promise((resolve) => setTimeout(resolve, 10));
  const degraded = await catalog.searchCatalog(q, "all", "local");
  assert.equal(degraded.readiness.local, "degraded");
  assert.equal(degraded.results[0]?.entity_id, row.id);
  // Expiring the retry cooldown must not imply that the dependency recovered.
  t.mock.method(Date, "now", () => now + 63_000);
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => { release = resolve; });
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    await blocked;
    return matched(input);
  });
  const retrying = await catalog.searchCatalog(q, "all", "local");
  assert.equal(retrying.readiness.local, "degraded");
  release();
  await new Promise((resolve) => setTimeout(resolve, 10));
  const recovered = await catalog.searchCatalog(q, "all", "local");
  assert.equal(recovered.readiness.local, "fresh");
  assert.equal(recovered.results[0]?.entity_id, row.id);
});

test("stalled database reads abort within the shared fill deadline without extra attempts", async (t) => {
  let started = 0;
  let aborted = 0;
  t.mock.method(globalThis, "fetch", (_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      started++;
      init!.signal!.addEventListener("abort", () => { aborted++; reject(init!.signal!.reason); }, { once: true });
    }));
  const start = performance.now();
  const result = await catalog.searchCatalog("stalled-case", "all", "local");
  assert.equal(started, 7);
  assert.equal(aborted, 7);
  assert.equal(result.readiness.local, "degraded");
  assert.ok(performance.now() - start < 4_000);
});


test("a cold canonical lookup keeps valid identities beyond a sub-second budget", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1_100));
    return Response.json([{ id: row.id, provider_id: "888" }]);
  });
  const result = await catalog.attachSearchEntityIds([{ provider_id: "888" }]);
  assert.equal(result.status, "fresh");
  assert.equal(result.candidates[0]?.entity_id, row.id);
});

test("cancelling one local caller returns promptly while another reuses its fill", async (t) => {
  cacheEnabled = true;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => { started = resolve; });
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => { release = resolve; });
  let reads = 0;
  t.mock.method(globalThis, "fetch", (input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      if (++reads === 7) started();
      init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason), { once: true });
      void blocked.then(() => resolve(matched(input)));
    }));
  const controller = new AbortController();
  const url = "https://kocteau.test/api/search?q=caller-cancel-case&source=local";
  const cancelled = searchRoute.GET(new Request(url, { signal: controller.signal }));
  const survivor = searchRoute.GET(new Request(url));
  await ready;
  const start = performance.now();
  controller.abort();
  try {
    assert.equal((await cancelled).status, 499);
    assert.ok(performance.now() - start < 500, "the caller must not wait for the three-second shared deadline");
  } finally { release(); }
  const completed = await survivor;
  assert.equal(completed.status, 200);
  assert.equal((await completed.json())[0].entity_id, row.id);
  assert.equal(reads, 7, "cancelling one waiter must not restart the shared fill");
});

test("canonical-link callers cancel independently while a shared fill completes", async (t) => {
  let started!: () => void;
  const ready = new Promise<void>((resolve) => { started = resolve; });
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => { release = resolve; });
  let reads = 0;
  t.mock.method(globalThis, "fetch", (_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      reads++;
      started();
      init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason), { once: true });
      void blocked.then(() => resolve(Response.json([{ id: row.id, provider_id: "cancel-link" }])));
    }));
  const controller = new AbortController();
  const candidates = [{ provider_id: "cancel-link" }];
  const cancelled = catalog.attachSearchEntityIds(candidates, { signal: controller.signal });
  const survivor = catalog.attachSearchEntityIds(candidates);
  await ready;
  controller.abort();
  try { await assert.rejects(cancelled, { name: "AbortError" }); }
  finally { release(); }
  assert.equal((await survivor).candidates[0]?.entity_id, row.id);
  assert.equal(reads, 1);
});

test("empty and invalid search responses cannot be cached", async () => {
  for (const [path, route] of [
    ["/api/search", searchRoute],
    ["/api/deezer/search", legacySearchRoute],
  ] as const) {
    const empty = await route.GET(new Request("https://kocteau.test" + path));
    assert.equal(empty.status, 200);
    assert.deepEqual(await empty.json(), []);
    assert.equal(empty.headers.get("Cache-Control"), "no-store");
    const invalid = await route.GET(new Request("https://kocteau.test" + path + "?type=unknown"));
    assert.equal(invalid.status, 400);
    assert.equal(invalid.headers.get("Cache-Control"), "no-store");
  }
  assert.equal(calls.length, 0);
});
