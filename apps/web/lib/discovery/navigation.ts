import type { SearchEntityType } from "../search-types.ts";
import { buildEntityCanonicalPath } from "../seo-routes.ts";

type DiscoveryEntityRouteInput = {
  entityId: string | null;
  providerId: string;
  type: SearchEntityType;
  title: string;
  artistName: string | null;
};

export function getDiscoveryEntityPath({
  entityId,
  providerId,
  type,
  title,
  artistName,
}: DiscoveryEntityRouteInput) {
  return buildEntityCanonicalPath({
    id: entityId,
    provider: "deezer",
    provider_id: providerId,
    type,
    title,
    artist_name: artistName,
  });
}
