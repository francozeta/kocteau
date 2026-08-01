import DiscoveryMap from "@/components/discovery-map";
import type { DiscoverySeed } from "@/lib/discovery/seed";
import type { StarterTrack } from "@/lib/starter";

type DiscoverEditorialEditionProps = {
  starterTracks?: StarterTrack[];
  initialQuery?: string;
  initialSeed?: DiscoverySeed | null;
};

export default function DiscoverEditorialEdition({
  starterTracks = [],
  initialQuery = "",
  initialSeed = null,
}: DiscoverEditorialEditionProps) {
  return (
    <DiscoveryMap
      seeds={starterTracks}
      initialQuery={initialQuery}
      initialSeed={initialSeed}
    />
  );
}
