import DiscoveryMap from "@/components/discovery-map";
import type { DiscoverySeed } from "@/lib/discovery/seed";
import type { StarterTrack } from "@/lib/starter";

type DiscoverEditorialEditionProps = {
  starterTracks?: StarterTrack[];
  initialQuery?: string;
  initialSeed?: DiscoverySeed | null;
  viewerId?: string | null;
};

export default function DiscoverEditorialEdition({
  starterTracks = [],
  initialQuery = "",
  initialSeed = null,
  viewerId = null,
}: DiscoverEditorialEditionProps) {
  return (
    <DiscoveryMap
      key={`${viewerId ?? "guest"}:${initialSeed?.type ?? "home"}:${initialSeed?.provider_id ?? ""}`}
      viewerId={viewerId}
      seeds={starterTracks}
      initialQuery={initialQuery}
      initialSeed={initialSeed}
    />
  );
}
