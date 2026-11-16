export type SearchReadinessStatus = "fresh" | "stale" | "degraded" | "unknown";
type SourceStatus = SearchReadinessStatus | "skipped";

export type SearchReadiness = {
  status: SearchReadinessStatus;
  local: SourceStatus;
  links: SourceStatus;
  provider: SourceStatus;
};

function sourceStatus(value: string | null): SourceStatus {
  return value === "fresh" || value === "stale" || value === "degraded" || value === "skipped"
    ? value
    : "unknown";
}

export function readSearchReadiness(headers: Headers): SearchReadiness {
  const status = sourceStatus(headers.get("X-Kocteau-Search-Status"));
  return {
    status: status === "skipped" ? "unknown" : status,
    local: sourceStatus(headers.get("X-Kocteau-Search-Local")),
    links: sourceStatus(headers.get("X-Kocteau-Search-Links")),
    provider: sourceStatus(headers.get("X-Kocteau-Search-Provider")),
  };
}

export function searchPhasesToRefetch(
  phases: readonly { isError: boolean; readiness?: SearchReadiness }[],
) {
  const failed = phases.map((phase) => phase.isError || phase.readiness?.status === "degraded");
  // An explicit refresh with no failed phase still refreshes the whole search.
  return failed.some(Boolean) ? failed : phases.map(() => true);
}
