import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import type { EntityPage, EntityTasteTag } from "./entities";
import type { DeezerTrackResult } from "../deezer";

const calls: string[] = [];
let loadTags = async (): Promise<EntityTasteTag[]> => [];
let loadSource = async (mode: string) => {
  calls.push(mode);
  return { seedLabel: "Artist", tracks: [] as DeezerTrackResult[] };
};
let queryRows: (table: string) => unknown = () => [];
const client = createClient("https://music.test", "sb_publishable_test", {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: async (input) => {
      const table = new URL(String(input)).pathname.split("/").at(-1) ?? "";
      calls.push(table);
      return new Response(JSON.stringify(queryRows(table)), {
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
  viewer: {},
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
  assert.deepEqual(calls.sort(), ["entity_preference_tags", "reviews"]);
});

test("id-only callers still load the public entity and preserve missing results", async () => {
  queryRows = (table) => table === "entities" ? entity : [];
  const bundle = await entities.getTrackPublicBundle(entity.id);
  assert.deepEqual(bundle?.entity, entity);
  assert.deepEqual(calls.sort(), ["entities", "entity_preference_tags", "reviews"]);
  queryRows = (table) => table === "entities" ? null : [];
  assert.equal(await entities.getTrackPublicBundle("00000000-0000-4000-8000-000000000002"), null);
});
