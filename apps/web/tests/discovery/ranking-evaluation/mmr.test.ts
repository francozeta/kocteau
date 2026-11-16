import assert from "node:assert/strict";
import test from "node:test";
import { CANVAS_LIMIT, seedKey, type DiscoveryCandidate } from "../../../lib/discovery/canvas.ts";
import { rankingFixtures } from "./fixtures.ts";
import { artistIdentity, rankMmr, redundancyEvidence, scoredCandidates, selectionProxies, type RankingFixture } from "./mmr.ts";

const balanced = rankingFixtures[0];
function track(id: string, artistId: string | null, score: number): DiscoveryCandidate {
  return {
    seed: {
      ...balanced.seed, id, provider_id: id,
      artist_name: artistId ? `Artist ${artistId}` : null,
      artist_provider_id: artistId,
      cover_url: `https://example.invalid/${id}.jpg`,
    },
    lane: "nearby", reason: "Synthetic test candidate", score,
  };
}
function fixture(candidates: DiscoveryCandidate[]): RankingFixture {
  return { ...balanced, candidates, variation: "", features: {}, memory: [] };
}
function keys(items: readonly DiscoveryCandidate[]) {
  return items.map((item) => seedKey(item.seed));
}

test("frozen fixture replay is deterministic and leaves every input unchanged", () => {
  for (const input of rankingFixtures) {
    const snapshot = JSON.stringify(input);
    const first = keys(rankMmr(input));
    assert.deepEqual(keys(rankMmr(input)), first);
    assert.deepEqual(keys(rankMmr({ ...input, candidates: [...input.candidates].reverse() })), first);
    assert.equal(JSON.stringify(input), snapshot);
  }
});

test("hard policies exclude the seed, missing artwork, nonfinite scores and repeated identity/artwork", () => {
  const valid = track("2", "a", 70);
  const duplicate = { ...valid, score: 55 };
  const sameCover = track("3", "b", 69);
  sameCover.seed.cover_url = valid.seed.cover_url + "?size=small";
  const noCover = track("4", "c", 100);
  noCover.seed.cover_url = null;
  const sameSeed = { ...track("1", "d", 200), seed: balanced.seed };
  const seedCover = track("5", "e", 90);
  seedCover.seed.cover_url = balanced.seed.cover_url;
  const badScore = track("6", "f", NaN);
  const selected = rankMmr(fixture([sameSeed, noCover, valid, duplicate, sameCover, seedCover, badScore]));
  assert.deepEqual(keys(selected), [seedKey(valid.seed)]);
});

test("artist quotas use IDs across aliases while homonymous artists remain distinct", () => {
  const aliases = [track("2", "same-id", 80), track("3", "same-id", 79), track("4", "same-id", 78)];
  aliases.forEach((item, index) => { item.seed.artist_name = `Alias ${index}`; });
  const homonyms = [track("5", "different-1", 77), track("6", "different-2", 76), track("7", "different-3", 75)];
  homonyms.forEach((item) => { item.seed.artist_name = "Shared name"; });
  const selected = rankMmr(fixture([...aliases, ...homonyms]));
  assert.equal(selected.filter((item) => item.seed.artist_provider_id === "same-id").length, 2);
  assert.equal(selected.filter((item) => item.seed.artist_name === "Shared name").length, 3);
});

test("name fallback is scoped to unavailable IDs and missing metadata does not form a fake artist", () => {
  const missing = [track("2", null, 80), track("3", null, 79), track("4", null, 78)];
  const fallback = [track("5", null, 77), track("6", null, 76), track("7", null, 75)];
  fallback.forEach((item) => { item.seed.artist_name = " Name "; });
  const selected = rankMmr(fixture([...missing, ...fallback]));
  assert.equal(selected.length, 5);
  assert.equal(artistIdentity(fallback[0].seed), "name:name");
  assert.equal(artistIdentity(missing[0].seed), null);
});

test("lambda one preserves descending base relevance without a redundancy penalty", () => {
  const input = fixture([track("2", "a", 60), track("3", "b", 80), track("4", "c", 70)]);
  assert.deepEqual(keys(rankMmr(input, { lambda: 1 })), ["deezer:track:3", "deezer:track:4", "deezer:track:2"]);
  const scores = scoredCandidates(input).map((row) => row.relevance);
  assert.equal(scores[0], 1);
  assert.equal(scores.at(-1), 0);
});

test("lambda zero selects the relevance seed then avoids evidenced artist redundancy", () => {
  const input = fixture([track("2", "a", 80), track("3", "a", 79), track("4", "b", 60)]);
  assert.deepEqual(keys(rankMmr(input, { lambda: 0, limit: 2 })), ["deezer:track:2", "deezer:track:4"]);
  assert.deepEqual(keys(rankMmr(input, { lambda: 1, limit: 2 })), ["deezer:track:2", "deezer:track:3"]);
});

test("constant and empty relevance pools have finite normalization and deterministic ties", () => {
  const input = fixture([track("3", "b", 60), track("2", "a", 60)]);
  assert(scoredCandidates(input).every((row) => row.relevance === 1));
  assert.deepEqual(keys(rankMmr(input)), ["deezer:track:2", "deezer:track:3"]);
  assert.deepEqual(rankMmr(fixture([])), []);
  assert.deepEqual(rankMmr(input, { limit: 0 }), []);
  assert.equal(selectionProxies(input, []).meanNormalizedBaseRelevance, null);
});

test("unknown pair metadata remains unknown rather than a claim of musical distance", () => {
  const a = track("2", null, 60);
  const b = track("3", null, 60);
  assert.deepEqual(redundancyEvidence(a, b, {}), { value: 0, known: false });
  const mixedIdentity = track("4", "a", 60);
  a.seed.artist_name = "Artist a";
  assert.deepEqual(redundancyEvidence(a, mixedIdentity, {}), { value: 0, known: false });
  a.seed.artist_name = null;
  const input = fixture([a, b]);
  const metrics = selectionProxies(input, rankMmr(input));
  assert.equal(metrics.knownPairCoverage, 0);
  assert.equal(metrics.meanKnownPairRedundancy, null);
  const features = {
    [seedKey(a.seed)]: { tags: ["genre:x", "era:y"] },
    [seedKey(b.seed)]: { tags: ["genre:x", "era:z"] },
  };
  assert.deepEqual(redundancyEvidence(a, b, features), { value: 1 / 6, known: true });
});

test("lambda and result budget validate boundaries", () => {
  for (const lambda of [-1, 1.01, NaN, Infinity]) assert.throws(() => rankMmr(balanced, { lambda }), RangeError);
  for (const limit of [-1, 1.5, NaN, CANVAS_LIMIT + 1]) assert.throws(() => rankMmr(balanced, { limit }), RangeError);
  assert(rankMmr(balanced, { limit: CANVAS_LIMIT }).length <= CANVAS_LIMIT);
});
