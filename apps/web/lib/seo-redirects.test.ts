import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { NextRequest } from "next/server";

const track = {
  id: "1abcdef0-1234-4000-8000-000000000001",
  provider: "deezer",
  provider_id: "42",
  type: "track",
  title: "Fixture track",
  artist_name: "Fixture artist",
};
const album = { ...track, id: "4abcdef0-1234-4000-8000-000000000001", type: "album", title: "Fixture album" };
const artist = {
  id: "3abcdef0-1234-4000-8000-000000000001",
  provider: "deezer",
  provider_id: "44",
  name: "Fixture artist",
};
const review = { id: "2abcdef0-1234-4000-8000-000000000001", entities: track };
const specs = [
  { name: "former track canonical", kind: "track", path: (id: string) => `/tracks/stale-label/${id}` },
  { name: "former album canonical", kind: "album", path: (id: string) => `/albums/stale-label/${id}` },
  { name: "former artist canonical", kind: "artist", path: (id: string) => `/artists/stale-label/${id}` },
  { name: "former review canonical", kind: "review", path: (id: string) => `/reviews/${id}/stale-label` },
  { name: "singular track", kind: "track", path: (id: string) => `/track/${id}` },
  { name: "singular review", kind: "review", path: (id: string) => `/review/${id}` },
] as const;
type Kind = typeof specs[number]["kind"];
type Handler = (request: NextRequest, context: {
  params: Promise<{ id: string; reviewId: string; slug: string }>;
}) => Promise<Response>;
const handlers = new Map<string, Handler>();
const records = { track, album, artist, review };
const canonicalPaths: Record<Kind, string> = {
  track: "/tracks/fixture-track-fixture-artist-1abcdef01234",
  album: "/albums/fixture-album-fixture-artist-4abcdef01234",
  artist: "/artists/fixture-artist-3abcdef01234",
  review: "/reviews/fixture-track-fixture-artist-2abcdef01234",
};
let activeKind: Kind = "track";
let outcome: "found" | "missing" | "unavailable" = "found";
const calls: { table: string; id: string }[] = [];
let privateReads = 0;
let networkRequests = 0;
const nativeFetch = globalThis.fetch;

function publicLookup(table: string, id: string) {
  calls.push({ table, id });
  if (outcome === "unavailable") throw new Error("Synthetic public lookup failure");
  if (outcome === "missing") return null;
  return records[activeKind];
}
function privateRead() {
  privateReads++;
  throw new Error("A compatibility redirect must not read viewer state");
}
const stubs = {
  entities: {
    getEntityPageByRouteId: async (id: string) => publicLookup("entities", id),
    getTrackViewerState: privateRead,
  },
  artists: { getArtistPageByRouteId: async (id: string) => publicLookup("artists", id) },
  reviews: {
    getPublicReviewByRouteId: async (id: string) => publicLookup("reviews", id),
    getReviewViewerState: privateRead,
  },
  auth: { getCurrentUserId: privateRead, getCurrentViewerProfile: privateRead },
  viewer: { getViewerReviewCollectionState: privateRead },
  server: { supabaseServer: privateRead },
};
const stubKey = Symbol.for("kocteau.seo-redirects.test");
const modules = new Map([
  ["@/lib/queries/entities", "entities"],
  ["@/lib/queries/artists", "artists"],
  ["@/lib/queries/reviews", "reviews"],
  ["@/lib/auth/server", "auth"],
  ["@/lib/queries/viewer", "viewer"],
  ["@/lib/supabase/server", "server"],
]);

before(async () => {
  Object.defineProperty(globalThis, stubKey, { value: stubs, configurable: true });
  globalThis.fetch = async () => {
    networkRequests++;
    throw new Error("Redirect unit tests cannot make network requests");
  };
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const stub = modules.get(specifier);
      return stub ? { url: `redirect-test:${stub}`, shortCircuit: true } : nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (!url.startsWith("redirect-test:")) return nextLoad(url, context);
      return {
        format: "commonjs",
        source: `module.exports = globalThis[Symbol.for("kocteau.seo-redirects.test")][${JSON.stringify(url.slice("redirect-test:".length))}];`,
        shortCircuit: true,
      };
    },
  });
  try {
    const routes = await Promise.all([
      import("../app/(main)/tracks/[slug]/[id]/route.ts"),
      import("../app/(main)/albums/[slug]/[id]/route.ts"),
      import("../app/(main)/artists/[slug]/[id]/route.ts"),
      import("../app/(main)/reviews/[reviewId]/[slug]/route.ts"),
      import("../app/(main)/track/[id]/route.ts"),
      import("../app/(main)/review/[id]/route.ts"),
    ]);
    routes.forEach((route, index) => handlers.set(specs[index].name, route.GET));
  } finally {
    hooks.deregister();
  }
});
after(() => {
  globalThis.fetch = nativeFetch;
  Reflect.deleteProperty(globalThis, stubKey);
});
beforeEach(() => {
  outcome = "found";
  calls.length = 0;
  privateReads = 0;
  networkRequests = 0;
});
afterEach(() => {
  assert.equal(privateReads, 0, "redirects must use public identity only");
  assert.equal(networkRequests, 0, "all query boundaries must remain isolated");
});

async function invoke(spec: typeof specs[number], id: string) {
  activeKind = spec.kind;
  const handler = handlers.get(spec.name);
  assert.ok(handler);
  const url = new URL(spec.path(encodeURIComponent(id)), "https://preview.invalid");
  url.searchParams.set("reviewsAfter", "cursor+with/symbols=");
  url.searchParams.set("editReview", "edit-review-id");
  url.searchParams.set("next", "https://untrusted.invalid");
  return handler(new NextRequest(url), {
    params: Promise.resolve({ id, reviewId: id, slug: "stale-label" }),
  });
}

for (const spec of specs) {
  test(`${spec.name} redirects supported aliases directly with a relative canonical Location`, async () => {
    const uuid = records[spec.kind].id;
    const compact = uuid.replaceAll("-", "");
    for (const id of [uuid, compact.slice(0, 12), compact.slice(0, 8), compact.slice(0, 12).toUpperCase()]) {
      const response = await invoke(spec, id);
      assert.equal(response.status, 308);
      const location = response.headers.get("location");
      assert.ok(location);
      assert.ok(location.startsWith("/") && !location.startsWith("//"));
      const target = new URL(location, "https://another-origin.invalid");
      assert.equal(target.origin, "https://another-origin.invalid");
      assert.equal(target.pathname, canonicalPaths[spec.kind]);
      assert.equal(target.searchParams.get("reviewsAfter"), "cursor+with/symbols=");
      assert.equal(target.searchParams.get("editReview"), "edit-review-id");
      assert.equal(target.searchParams.has("next"), false);
      assert.equal(response.body, null);
      assert.deepEqual(calls.at(-1), {
        table: spec.kind === "artist" ? "artists" : spec.kind === "review" ? "reviews" : "entities",
        id,
      });
    }
    assert.equal(calls.length, 4);
  });

  test(`${spec.name} returns uncached 503 on origin failure and retries the same identity`, async () => {
    outcome = "unavailable";
    const id = records[spec.kind].id;
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await invoke(spec, id);
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("retry-after"), "3");
      assert.equal(response.headers.get("location"), null);
      assert.match(await response.text(), /Reload to retry/);
    }
    assert.equal(calls.length, 2);
    outcome = "found";
    assert.equal((await invoke(spec, id)).status, 308);
    assert.equal(calls.length, 3);
  });

  test(`${spec.name} distinguishes successful absence from a temporary failure`, async () => {
    outcome = "missing";
    const response = await invoke(spec, records[spec.kind].id);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("retry-after"), null);
    assert.equal(calls.length, 1);
  });

  test(`${spec.name} rejects invalid identifiers without querying identity or viewer data`, async () => {
    for (const id of ["", "invalid", "1234567", "123456789abcd", "id;select-from-entities"]) {
      const response = await invoke(spec, id);
      assert.equal(response.status, 404);
      assert.equal(response.headers.get("location"), null);
    }
    assert.equal(calls.length, 0);
  });
}
