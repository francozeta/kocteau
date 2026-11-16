import { candidatesFromGroups } from "./canvas";
import type { RankingFixture } from "./mmr";
import type { DiscoverySeed } from "./seed";
import type { TrackRecommendationGroup } from "../recommendations/track-recommendation-ranking";

export type DiscoveryLabPool = {
  seedProviderId: string;
  variation: number;
  partial: boolean;
  groups: TrackRecommendationGroup[];
};

export type DiscoveryLabSnapshot = {
  version: 1;
  partial: boolean;
  retrievalVariation: number;
  input: RankingFixture;
};

/** Copy one public response; ranking never reads account history or the clock again. */
export function createDiscoveryLabSnapshot(
  seed: DiscoverySeed,
  pool: DiscoveryLabPool,
  now: number,
  requestedVariation: number,
): DiscoveryLabSnapshot {
  if (pool.seedProviderId !== seed.provider_id || pool.variation !== requestedVariation)
    throw new Error("The candidate pool did not match the requested seed and variation.");
  if (!Number.isFinite(now) || !Number.isInteger(pool.variation) ||
      pool.variation < 0 || pool.variation > 15 ||
      typeof pool.partial !== "boolean" || !Array.isArray(pool.groups))
    throw new Error("The candidate snapshot is invalid. Retry this seed.");

  const candidates = candidatesFromGroups(pool.groups).map((candidate) =>
    Object.freeze({ ...candidate, seed: Object.freeze({ ...candidate.seed }) }));
  const input: RankingFixture = Object.freeze({
    id: `deezer:track:${seed.provider_id}:${pool.variation}:${now}`,
    provenance: "public-snapshot",
    seed: Object.freeze({ ...seed }),
    candidates: Object.freeze(candidates),
    memory: Object.freeze([]),
    now,
    // The retrieval variation is the same deterministic rank variation for every panel.
    variation: `preview:${pool.variation}`,
    features: Object.freeze({}),
  });
  return Object.freeze({
    version: 1,
    partial: pool.partial,
    retrievalVariation: pool.variation,
    input,
  });
}
