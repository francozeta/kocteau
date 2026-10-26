import "server-only";

import { revalidateTag } from "next/cache";
import { getShortRouteId } from "@/lib/seo-routes";

export function canonicalRouteTag(kind: "review" | "entity", id: string) {
  return `${kind}-route:${getShortRouteId(id).slice(0, 8)}`;
}

export function expireCanonicalRouteReads(
  kind: "review" | "entity",
  id: string,
) {
  revalidateTag(`${kind}:${id.toLowerCase()}`, { expire: 0 });
  revalidateTag(canonicalRouteTag(kind, id), { expire: 0 });
}
