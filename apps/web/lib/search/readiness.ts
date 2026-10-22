import type { LookupStatus } from "./public-lookup";

export function searchReadinessHeaders(readiness: {
  local: LookupStatus;
  links: LookupStatus;
  provider: LookupStatus;
}) {
  const values = Object.values(readiness);
  return {
    "Cache-Control": "no-store",
    "X-Kocteau-Search-Status": values.includes("degraded") ? "degraded"
      : values.includes("stale") ? "stale" : "fresh",
    "X-Kocteau-Search-Local": readiness.local,
    "X-Kocteau-Search-Links": readiness.links,
    "X-Kocteau-Search-Provider": readiness.provider,
  };
}
