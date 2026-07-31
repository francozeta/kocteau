import DiscoveryMap from "@/components/discovery-map";
import type { StarterTrack } from "@/lib/starter";

type DiscoverEditorialEditionProps = {
  starterTracks?: StarterTrack[];
  initialSeedProviderId?: string | null;
};

export default function DiscoverEditorialEdition({
  starterTracks = [],
  initialSeedProviderId,
}: DiscoverEditorialEditionProps) {
  return (
    <DiscoveryMap
      seeds={starterTracks}
      initialSeedProviderId={initialSeedProviderId}
    />
  );
}
