import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import type { EntityPage, EntityTasteTag } from "./entities";
import type { DeezerTrackResult } from "../deezer";

const calls: string[] = [];
const requests: URL[] = [];
const collectionRequests: string[][] = [];
let loadTags = async (): Promise<EntityTasteTag[]> => [];
let loadSource = async (mode: string) => {
  calls.push(mode);
  return { seedLabel: "Artist", tracks: [] as DeezerTrackResult[] };
};
let queryRows: (table: string, url: URL) => unknown = () => [];
let queryStatus = 200;
const client = createClient("https://music.test", "sb_publishable_test", {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: async (input) => {
      const url = new URL(String(input));
      requests.push(url);
      const table = url.pathname.split("/").at(-1) ?? "";
      calls.push(table);
      const rows = queryStatus >= 400 ? queryRows(table, url) : table === "get_entity_review_summary"
        ? { review_count: 0, average_rating: null }
        : queryRows(table, url);
      return new Response(JSON.stringify(rows), {
        status: queryStatus,
        headers: { "Content-Type": "application/json" },
      });
    },
  },
});
const stubs = {
  empty: {},
  cache: { unstable_cache: (run: unknown) => run },
  perf: { measureServerTask: (_name: string, run: () => unknown) => run() },
  public: { supabasePublic: () => client },
  server: { supabaseServer: async () => client },
  viewer: { getViewerReviewCollectionState: async (_viewer: string, reviewIds: string[]) => {
    collectionRequests.push(reviewIds);
    return { likedReviewIds: new Set<string>(), bookmarkedReviewIds: new Set<string>() };
  } },
  tags: { getEntityTasteTags: () => { calls.push("tags"); return loadTags(); } },
  deezer: {
    getDeezerTrack: async () => {
      calls.push("catalog");
      return { artist_id: "10", artist_name: "Artist", artist_fan_count: 1000 };
    },
    getDeezerErrorDetails: () => ({ kind: "unavailable" }),
  },
  source: {
    getCandidateSourceTracks: ({ mode }: { mode: string }) => loadSource(mode),
  },
};
const stubKey = Symbol.for("kocteau.music-io.test");
const modules = new Map([
  ["server-only", "empty"],
  ["next/cache", "cache"],
  ["@/lib/perf", "perf"],
  ["@/lib/supabase/public", "public"],
  ["@/lib/supabase/server", "server"],
  ["@/lib/queries/viewer", "viewer"],
  ["@/lib/queries/entities", "tags"],
  ["@/lib/deezer", "deezer"],
  ["@/lib/deezer-candidate-source", "source"],
]);
let recommendations: typeof import("./track-recommendations");
let entities: typeof import("./entities");

before(async () => {
  Object.defineProperty(globalThis, stubKey, { value: stubs, configurable: true });
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const stub = modules.get(specifier);
      return stub
        ? { url: `music-test:${stub}`, shortCircuit: true }
        : nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (!url.startsWith("music-test:")) return nextLoad(url, context);
      const name = url.slice("music-test:".length);
      return {
        format: "commonjs",
        source: `module.exports = globalThis[Symbol.for("kocteau.music-io.test")][${JSON.stringify(name)}];`,
        shortCircuit: true,
      };
    },
  });
  try {
    recommendations = await import("./track-recommendations");
    entities = await import("./entities");
  } finally {
    hooks.deregister();
  }
});
after(() => { Reflect.deleteProperty(globalThis, stubKey); });
beforeEach(() => {
  calls.length = 0;
  requests.length = 0;
  collectionRequests.length = 0;
  queryStatus = 200;
  loadTags = async () => [];
  loadSource = async (mode) => {
    calls.push(mode);
    return { seedLabel: "Artist", tracks: [] };
  };
  queryRows = () => [];
});
const options = {
  currentEntityId: "00000000-0000-4000-8000-000000000001",
  currentProviderId: "1",
  title: "Track",
  resolveLocalLinks: false,
};

test("external candidates finish while local tag resolution is still pending", async () => {
  let releaseTags!: (tags: EntityTasteTag[]) => void;
  loadTags = () => new Promise((resolve) => { releaseTags = resolve; });
  let completeSources!: () => void;
  const sourcesReady = new Promise<void>((resolve) => { completeSources = resolve; });
  let sources = 0;
  loadSource = async (mode) => {
    calls.push(mode);
    if (++sources === 2) completeSources();
    return { seedLabel: "Artist", tracks: [] };
  };
  const pending = recommendations.getTrackRecommendations(options);
  try {
    await Promise.race([
      sourcesReady,
      new Promise<never>((_, reject) => {
        const timer = setTimeout(() => reject(new Error("external lanes waited for local tags")), 1000);
        sourcesReady.then(() => clearTimeout(timer));
      }),
    ]);
    assert.deepEqual(calls.slice(0, 2), ["tags", "catalog"]);
    assert.ok(calls.includes("related"));
    assert.ok(calls.includes("deep-cut"));
  } finally {
    releaseTags([]);
    await pending;
  }
});

test("an explicitly empty tag result is reused without another tag read", async () => {
  await recommendations.getTrackRecommendations({ ...options, tags: [] });
  assert.equal(calls.filter((call) => call === "tags").length, 0);
  assert.equal(calls.filter((call) => call === "entity_preference_tags").length, 0);
});

test("omitted tags still resolve the entity's local signals", async () => {
  await recommendations.getTrackRecommendations(options);
  assert.equal(calls.filter((call) => call === "tags").length, 1);
});

test("disabled sources do not issue catalog, tag, or provider requests", async () => {
  const groups = await recommendations.getTrackRecommendations({
    ...options,
    includeLocalSignals: false,
    includeRelatedCandidates: false,
    includeDeepCuts: false,
    resolveCatalogContext: false,
  });
  assert.deepEqual(groups, []);
  assert.deepEqual(calls, []);
});

test("a failed external lane keeps candidates from the other lane", async (t) => {
  t.mock.method(console, "warn", () => {});
  loadSource = async (mode) => {
    if (mode === "related") throw new Error("provider unavailable");
    return { seedLabel: "Artist", tracks: [{
      provider: "deezer", provider_id: "200", type: "track", title: "Deep track",
      artist_name: "Other artist", artist_id: "20", cover_url: null, deezer_url: null,
      rank: 1000, artist_fan_count: 1000,
    }] };
  };
  const groups = await recommendations.getTrackRecommendations({ ...options, tags: [] });
  assert.ok(groups.flatMap((group) => group.recommendations)
    .some((track) => track.provider_id === "200"));
});

const entity: EntityPage = {
  id: options.currentEntityId, provider: "deezer", provider_id: "1", type: "track",
  title: "Track", artist_name: "Artist", artist_id: null, parent_album_id: null,
  cover_url: null, deezer_url: null, release_date: null, record_type: null,
  disambiguation: null, musicbrainz_recording_id: null,
  musicbrainz_release_group_id: null, first_release_date: null, genres: [],
};

test("a resolved public entity avoids another entity query", async () => {
  const bundle = await entities.getTrackPublicBundle(entity);
  assert.equal(bundle?.entity, entity);
  assert.deepEqual(calls.sort(), ["entity_preference_tags", "get_entity_review_summary", "reviews"]);
});

test("id-only callers still load the public entity and preserve missing results", async () => {
  queryRows = (table) => table === "entities" ? entity : [];
  const bundle = await entities.getTrackPublicBundle(entity.id);
  assert.deepEqual(bundle?.entity, entity);
  assert.deepEqual(calls.sort(), ["entities", "entity_preference_tags", "get_entity_review_summary", "reviews"]);
  queryRows = (table) => table === "entities" ? null : [];
  assert.equal(await entities.getTrackPublicBundle("00000000-0000-4000-8000-000000000002"), null);
});

test("review summaries preserve a null average for an empty discussion", async () => {
  const summary = await entities.getEntityReviewSummary(entity.id);
  assert.deepEqual(summary, { reviewCount: 0, averageRating: null });
  assert.deepEqual(calls, ["get_entity_review_summary"]);
});

test("review cursors traverse equal timestamps without omissions or duplicates", async () => {
  const { decodeEntityReviewCursor } = await import("../reviews/entity-pagination");
  const rows = Array.from({ length: 35 }, (_, i) => ({
    id: `75000000-0000-4000-8000-${String(35 - i).padStart(12, "0")}`,
    created_at: `2026-10-${21 - Math.floor(i / 15)}T12:00:00.123456+00:00`,
    title: null, body: null, rating: 4, likes_count: 0, comments_count: 0,
    is_pinned: false, author: null,
  }));
  queryRows = (table, url) => {
    assert.equal(table, "reviews");
    const params = url.searchParams;
    assert.equal(params.get("entity_id"), "eq." + entity.id);
    assert.equal(params.get("limit"), "13");
    assert.equal(params.get("order"), "created_at.desc,id.desc");
    let filtered = rows;
    const filter = params.get("or");
    if (filter) {
      const match = filter.match(/^\(created_at\.lt\.([^,]+),and\(created_at\.eq\.([^,]+),id\.lt\.([^)]+)\)\)$/);
      assert.ok(match, "cursor filter must keep timestamp and UUID comparisons");
      const [, olderThan, sameTime, id] = match;
      assert.equal(olderThan, sameTime);
      assert.equal(params.get("created_at"), "lte." + olderThan);
      filtered = rows.filter((row) => row.created_at < olderThan
        || (row.created_at === sameTime && row.id < id));
    }
    return filtered.slice(0, Number(params.get("limit")));
  };
  const ids: string[] = [];
  let cursor: string | null = null;
  let pages = 0;
  do {
    const page = await entities.getEntityReviewsPage(entity.id, cursor);
    assert.ok(page.reviews.length <= 12);
    ids.push(...page.reviews.map((review) => review.id));
    if (page.nextCursor) {
      const last = page.reviews.at(-1)!;
      assert.deepEqual(decodeEntityReviewCursor(page.nextCursor), {
        id: last.id, created_at: last.created_at,
      });
    }
    cursor = page.nextCursor;
    assert.ok(++pages <= 3, "pagination must terminate");
  } while (cursor);
  assert.equal(pages, 3);
  assert.deepEqual(ids, rows.map((row) => row.id));
  assert.equal(new Set(ids).size, rows.length);
  const completedRequests = requests.length;
  await assert.rejects(entities.getEntityReviewsPage(entity.id, "invalid"), /Invalid review cursor/);
  assert.equal(requests.length, completedRequests);
});

test("the viewer can edit an older review outside the visible page", async () => {
  const own = { id: "own-review", title: "My title", body: "Older note", rating: 4, is_pinned: false };
  queryRows = () => own;
  const state = await entities.getTrackViewerState("viewer", entity.id, []);
  assert.equal(state.viewerReviewId, own.id);
  assert.deepEqual(state.viewerReview, own);
  assert.equal(requests[0].searchParams.get("author_id"), "eq.viewer");
  assert.equal(requests[0].searchParams.get("entity_id"), "eq." + entity.id);
  assert.deepEqual(collectionRequests, [[]]);
});

test("a visible own review avoids a second read and guests do no private work", async () => {
  const review = {
    id: "own-review", title: null, body: null, rating: 4, likes_count: 0, comments_count: 0,
    created_at: "2026-10-21T12:00:00Z", is_pinned: false,
    author: { id: "viewer", username: "viewer", display_name: null, avatar_url: null },
  };
  const state = await entities.getTrackViewerState("viewer", entity.id, [review]);
  assert.equal(state.viewerReviewId, review.id);
  assert.equal(requests.length, 0);
  assert.deepEqual(collectionRequests, [[review.id]]);
  const guest = await entities.getTrackViewerState(null, entity.id, [review]);
  assert.equal(guest.viewerReviewId, null);
  assert.equal(requests.length, 0);
  assert.equal(collectionRequests.length, 1);
});

test("temporary read failures propagate instead of becoming empty review pages", async () => {
  const entityId = "00000000-0000-4000-8000-000000000003";
  queryStatus = 503;
  queryRows = () => ({ code: "TEST_UNAVAILABLE", message: "temporarily unavailable" });
  await assert.rejects(entities.getEntityReviewsPage(entityId));
  const failedAttempts = requests.length;
  assert.ok(failedAttempts > 0);
  queryStatus = 200;
  queryRows = () => [];
  assert.deepEqual(await entities.getEntityReviewsPage(entityId), { reviews: [], nextCursor: null });
  assert.equal(requests.length, failedAttempts + 1);
});
