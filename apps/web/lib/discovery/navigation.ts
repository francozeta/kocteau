import type { SearchEntityType } from "../search-types.ts";
import { buildEntityCanonicalPath } from "../seo-routes.ts";
import type { CanvasSession } from "./canvas.ts";
import { getDiscoverySeedPath } from "./seed.ts";

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

export function matchDiscoverySessionToPath(
  session: CanvasSession | null,
  path: string,
) {
  if (!session) return null;
  const matches = (index: number) => {
    const focus = session.frames[index]?.focus;
    return focus ? getDiscoverySeedPath(focus) === path : path === "/search";
  };
  if (matches(session.cursor)) return session;
  const cursor = session.frames.findLastIndex((_, index) => matches(index));
  return cursor < 0 ? null : { ...session, cursor };
}
