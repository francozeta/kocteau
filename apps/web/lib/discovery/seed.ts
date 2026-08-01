import type { SearchEntityType } from "@/lib/search-types";
import { slugifyForUrl } from "@/lib/seo-routes";

export type DiscoverySeed = {
  id: string;
  entityId: string | null;
  provider_id: string;
  type: SearchEntityType;
  title: string;
  artist_name: string | null;
  artist_provider_id: string | null;
  cover_url: string | null;
};

export function getDiscoverySeedPath(
  seed: Pick<DiscoverySeed, "provider_id" | "title" | "type">,
) {
  return `/search/${seed.type}/${slugifyForUrl(seed.title)}/${encodeURIComponent(seed.provider_id)}`;
}
