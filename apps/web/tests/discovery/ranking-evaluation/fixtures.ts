import { recordDiscoveryVisit, seedKey, type DiscoveryCandidate } from "../../../lib/discovery/canvas.ts";
import type { DiscoverySeed } from "../../../lib/discovery/seed.ts";
import type { RankingFixture } from "./mmr.ts";

const now = 1_800_000_000_000;
const lanes: DiscoveryCandidate["lane"][] = ["nearby", "left-field", "deep-cut", "serendipity"];

function seed(id: number, artistId: number | null): DiscoverySeed {
  return {
    id: `fixture:${id}`,
    entityId: null,
    provider_id: String(id),
    type: "track",
    title: `Synthetic track ${id}`,
    artist_name: artistId === null ? null : `Synthetic artist ${artistId}`,
    artist_provider_id: artistId === null ? null : String(artistId),
    cover_url: `https://example.invalid/fixture-${id}.jpg`,
  };
}

function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}

function fixture(id: string, count: number, tweak?: (item: DiscoveryCandidate, index: number) => void): RankingFixture {
  const candidates = Array.from({ length: count }, (_, index) => {
    const item: DiscoveryCandidate = {
      seed: seed(10_000 + index, 500 + index % 8),
      lane: lanes[index % lanes.length],
      score: 55 + (index * 7) % 27,
      reason: "Synthetic metadata relationship",
    };
    tweak?.(item, index);
    return item;
  });
  return {
    id,
    provenance: "synthetic",
    seed: seed(1, 500),
    now,
    variation: `fixture:${id}:v1`,
    candidates,
    memory: [],
    features: Object.fromEntries(candidates.map((item, index) => [seedKey(item.seed), {
      albumId: `album:${Math.floor(index / 3)}`,
      tags: [`synthetic-genre:${index % 4}`, `synthetic-era:${index % 3}`],
    }])),
  };
}

const balanced = fixture("balanced-pool", 32);
const familiar = fixture("familiar-and-revisited", 32);
familiar.memory = recordDiscoveryVisit([], familiar.candidates[1].seed, now - 86_400_000);
for (let visit = 0; visit < 3; visit++) {
  familiar.memory = recordDiscoveryVisit([...familiar.memory], familiar.candidates[0].seed, now - 60_000);
}
const homonyms = fixture("homonyms-and-aliases", 16, (item, index) => {
  item.seed.artist_name = index < 8 ? "Shared display name" : `Alias ${index}`;
  item.seed.artist_provider_id = index < 8 ? String(800 + index) : "900";
});
const repeatedArtwork = fixture("repeated-artwork", 32, (item, index) => {
  item.seed.cover_url = `https://example.invalid/album-${Math.floor(index / 4)}.jpg?size=${index}`;
});
const missing = fixture("missing-metadata", 16, (item, index) => {
  if (index % 2 === 0) item.seed.artist_provider_id = null;
  if (index % 3 === 0) item.seed.artist_name = null;
  if (index % 5 === 0) item.seed.cover_url = null;
});
missing.features = {};
const sparse = fixture("sparse-pool", 3);
sparse.features = {};

/** Synthetic identities only; these fixtures contain no listener activity. */
export const rankingFixtures: readonly RankingFixture[] = freeze([
  balanced, familiar, homonyms, repeatedArtwork, missing, sparse,
]);
