import assert from "node:assert/strict";
import test from "node:test";
import { getDiscoveryCandidates } from "./candidates";
import type { DeezerTrackResult } from "../deezer";

function track(id: string, artistId = "45"): DeezerTrackResult {
  return {
    provider: "deezer",
    provider_id: id,
    type: "track",
    title: `Track ${id}`,
    artist_id: artistId,
    artist_name: `Artist ${artistId}`,
    artist_fan_count: 50_000,
    cover_url: `https://example.com/${id}.jpg`,
    deezer_url: null,
    rank: 120_000,
    album_id: `album-${id}`,
    release_date: "2001-01-01",
    duration_seconds: 240,
  };
}

function fixture() {
  const calls: string[] = [];
  const source: Parameters<typeof getDiscoveryCandidates>[1] = {
    track: async (id) => {
      calls.push(`track:${id}`);
      return track(id);
    },
    artist: async (id) => ({
      provider: "deezer",
      id,
      name: `Artist ${id}`,
      fan_count: 1,
      picture_url: null,
      deezer_url: null,
    }),
    album: async (id) => ({
      provider: "deezer",
      id,
      title: id,
      artist_id: "45",
      artist_name: "Artist 45",
      record_type: "album",
      cover_url: null,
      deezer_url: null,
      release_date: null,
    }),
    related: async () =>
      Array.from({ length: 12 }, (_, i) => ({
        provider: "deezer" as const,
        id: String(i + 100),
        name: `Artist ${i + 100}`,
        fan_count: 50_000,
        picture_url: null,
        deezer_url: null,
      })),
    top: async (artist) => {
      calls.push(`top:${artist.id}`);
      return Array.from({ length: 10 }, (_, i) =>
        track(`${artist.id}${i}`, artist.id),
      );
    },
    albums: async () => [
      {
        provider: "deezer",
        id: "500",
        title: "Other album",
        artist_id: "45",
        artist_name: "Artist 45",
        record_type: "album",
        cover_url: null,
        deezer_url: null,
        release_date: null,
      },
    ],
    tracks: async (album) => {
      calls.push(`album:${album.id}`);
      return [track(`${album.id}1`), track(`${album.id}2`)];
    },
  };
  return { source, calls };
}
const input = {
  providerId: "1",
  seedType: "track",
  lane: "fast",
  variation: 0,
} as const;
const ids = (result: Awaited<ReturnType<typeof getDiscoveryCandidates>>) =>
  result?.groups.flatMap((g) => g.recommendations.map((t) => t.provider_id));

test("different songs by the same artist open their own neighborhood and bounded source fanout", async () => {
  const { source, calls } = fixture();
  const a = await getDiscoveryCandidates(input, source);
  const b = await getDiscoveryCandidates({ ...input, providerId: "2" }, source);
  assert.notDeepEqual(ids(a), ids(b));
  assert.notDeepEqual(ids(a)?.toSorted(), ids(b)?.toSorted());
  assert.equal(a?.seedProviderId, "1");
  assert.ok(a?.groups.flatMap((group) => group.recommendations).every((item) =>
    item.artist_provider_id && item.artist_name === `Artist ${item.artist_provider_id}`));
  assert.equal(b?.seedProviderId, "2");
  assert.equal(calls.filter((call) => call.startsWith("top:")).length, 8);
  assert.ok(
    !calls.some((call) => call.startsWith("album:")),
    "Fast lane must not traverse albums",
  );
});

test("variants change entry points but remain reproducible for Back/reload", async () => {
  const { source } = fixture();
  const a = await getDiscoveryCandidates(input, source);
  const b = await getDiscoveryCandidates({ ...input, variation: 1 }, source);
  assert.notDeepEqual(ids(a), ids(b));
  assert.deepEqual(ids(a), ids(await getDiscoveryCandidates(input, source)));
});

test("deep lane adds actual other-release tracks; no seed or seed-cover duplicates survive", async () => {
  const { source } = fixture();
  source.top = async () => [
    track("1"),
    { ...track("999"), cover_url: track("1").cover_url },
  ];
  const a = await getDiscoveryCandidates({ ...input, lane: "deep" }, source);
  assert.ok(a?.groups.some((group) => group.id === "deep-cut"));
  assert.ok(!ids(a)?.some((id) => id === "1" || id === "999"));
});

test("a partial source outage preserves successful candidates without a starter fallback", async () => {
  const { source } = fixture();
  source.related = async () => {
    throw new Error("provider unavailable");
  };
  const result = await getDiscoveryCandidates(input, source);
  assert.ok(ids(result)!.length > 0);
  assert.equal(result?.partial, true);
  source.top = async () => {
    throw new Error("provider unavailable");
  };
  await assert.rejects(
    getDiscoveryCandidates(input, source),
    /sources unavailable/,
  );
});

test("missing identity never falls back to a title search or editorial tracks", async () => {
  const { source, calls } = fixture();
  source.track = async () => null;
  assert.equal(await getDiscoveryCandidates(input, source), null);
  assert.deepEqual(calls, []);
});

test("album seeds retain the selected artist fallback and use the highest ranked bounded track", async () => {
  const { source } = fixture();
  const album = await source.album("1");
  assert.ok(album);
  source.album = async () => ({ ...album, artist_id: null });
  source.tracks = async (_, artist, limit) => {
    assert.equal(artist.id, "45");
    assert.equal(limit, 12);
    return [
      { ...track("10"), rank: 1 },
      { ...track("11"), rank: 90 },
    ];
  };
  const result = await getDiscoveryCandidates(
    { ...input, seedType: "album", artistProviderId: "45" },
    source,
  );
  assert.equal(result?.seedProviderId, "11");
  assert.ok(ids(result)!.length > 0);
});

test("cancellation reaches the provider and prevents a second wave of requests", async () => {
  const { source, calls } = fixture();
  const abort = new AbortController();
  let providerSignal: AbortSignal | undefined;
  source.track = async (id, options) =>
    new Promise((_, reject) => {
      calls.push(`track:${id}`);
      providerSignal = options?.signal;
      options?.signal?.addEventListener(
        "abort",
        () => reject(options.signal?.reason),
        { once: true },
      );
    });
  const pending = getDiscoveryCandidates(
    { ...input, signal: abort.signal },
    source,
  );
  assert.deepEqual(calls, ["track:1"]);
  const reason = new DOMException("Caller cancelled exploration", "AbortError");
  abort.abort(reason);
  await assert.rejects(pending, (error) => error === reason);
  assert.equal(providerSignal?.aborted, true);
  assert.equal(providerSignal?.reason, reason);
  assert.deepEqual(calls, ["track:1"]);
});
