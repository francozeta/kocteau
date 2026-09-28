import assert from "node:assert/strict";
import test from "node:test";
import { collectCatalogSource, type CatalogSourceObservation } from "./source-evidence";
import {
  normalizeDeezerTrack,
  normalizeMusicBrainzArtist,
  normalizeMusicBrainzEntity,
} from "./source-normalization";

const context = {
  source: "musicbrainz" as const,
  sourceEntityType: "recording" as const,
  lookup: {
    provider: "deezer",
    providerId: "123",
    type: "track" as const,
    title: "Test track",
    artistName: "Test artist",
  },
  normalize: normalizeMusicBrainzEntity,
  now: () => "2026-09-28T05:00:00.000Z",
};

const match = {
  id: "00000000-0000-4000-8000-000000000001",
  score: 96,
  disambiguation: null,
  firstReleaseDate: "1998",
  recordType: "recording",
  genres: ["dream pop", "dreamy"],
};

test("source evidence retains the lookup, source identity, timestamp and search score", async () => {
  const observations: CatalogSourceObservation[] = [];
  const result = await collectCatalogSource({
    ...context,
    fetchSource: async () => match,
    persist: async (observation) => { observations.push(observation); },
  });

  assert.equal(result, match);
  assert.deepEqual(observations, [{
    source: "musicbrainz",
    sourceEntityType: "recording",
    lookup: context.lookup,
    schemaVersion: 1,
    retrievedAt: context.now(),
    status: "resolved",
    sourceEntityId: match.id,
    matchScore: 96,
    facts: { first_release_date: "1998", record_type: "recording", tags: ["dream pop", "dreamy"] },
    errorCode: null,
  }]);
  assert.equal("genres" in observations[0].facts, false);
});

test("an empty match records no_match rather than a failed provider", async () => {
  const observations: CatalogSourceObservation[] = [];
  assert.equal(await collectCatalogSource({
    ...context,
    fetchSource: async () => null,
    persist: async (observation) => { observations.push(observation); },
  }), null);
  assert.equal(observations[0].status, "no_match");
  assert.equal(observations[0].sourceEntityId, null);
  assert.deepEqual(observations[0].facts, {});
  assert.equal(observations[0].errorCode, null);
});

test("provider failures remain retryable without persisting raw error contents", async () => {
  const observations: CatalogSourceObservation[] = [];
  await assert.rejects(collectCatalogSource({
    ...context,
    fetchSource: async () => { throw new Error("private upstream response"); },
    persist: async (observation) => { observations.push(observation); },
  }), /musicbrainz recording evidence request failed/);
  assert.equal(observations[0].status, "failed");
  assert.equal(observations[0].errorCode, "request_failed");
  assert.equal(JSON.stringify(observations).includes("private"), false);
});

test("persistence failures stop projection and are not mislabeled as provider failures", async () => {
  let writes = 0;
  const persistenceError = new Error("database unavailable");
  await assert.rejects(collectCatalogSource({
    ...context,
    fetchSource: async () => match,
    persist: async () => { writes += 1; throw persistenceError; },
  }), (error) => error === persistenceError);
  assert.equal(writes, 1);
});

test("later provider failure leaves previously collected evidence intact", async () => {
  const observations: CatalogSourceObservation[] = [];
  const persist = async (observation: CatalogSourceObservation) => { observations.push(observation); };
  await collectCatalogSource({ ...context, fetchSource: async () => match, persist });
  await assert.rejects(collectCatalogSource({
    ...context,
    fetchSource: async () => { throw new Error("unavailable"); },
    persist,
  }));
  assert.deepEqual(observations.map((observation) => observation.status), ["resolved", "failed"]);
  assert.equal(observations[0].facts.first_release_date, "1998");
});

test("normalization keeps provider fields separate and does not infer absent signals", () => {
  assert.deepEqual(normalizeDeezerTrack({
    provider: "deezer", provider_id: "123", type: "track", title: "Test track",
    artist_name: null, artist_id: null, artist_fan_count: 1000,
    cover_url: null, deezer_url: null, rank: 99000,
    album_record_type: "album", release_date: "2001-02-03",
  }), {
    sourceEntityId: "123", matchScore: null,
    facts: { title: "Test track", album_record_type: "album", release_date: "2001-02-03" },
  });
  assert.deepEqual(normalizeMusicBrainzArtist({
    id: match.id, score: 90, type: "Group", countryCode: "GB",
    disambiguation: null, lifeSpanBegin: null, lifeSpanEnd: null, genres: [],
  }).facts, { artist_type: "Group", country_code: "GB" });
});
