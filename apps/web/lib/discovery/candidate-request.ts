import type { DiscoverySeed } from "./seed";

export function discoveryCandidateRequest(
  seed: DiscoverySeed,
  lane: "fast" | "deep",
  variation: number,
) {
  const artistProviderId = seed.type === "album" ? seed.artist_provider_id : null;
  const params = new URLSearchParams({
    providerId: seed.provider_id,
    seedType: seed.type,
    lane,
    variation: String(variation),
  });
  if (artistProviderId) params.set("artistProviderId", artistProviderId);
  return {
    queryKey: [
      "discovery-candidates-v3",
      seed.type,
      seed.provider_id,
      artistProviderId,
      variation,
      lane,
    ] as const,
    url: `/api/discovery/map?${params}`,
  };
}
