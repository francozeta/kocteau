// Session-cookie refresh and authorization decisions for the Next.js 16 Proxy.
// This module has no Next.js runtime dependency so edge cases can be unit tested.
export function isTransientAuthFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return true;
  const info = error as { status?: number; name?: string; code?: string };
  if (info.name === "AuthRetryableFetchError" || info.name === "TypeError") {
    return true;
  }
  if (typeof info.status === "number") {
    return info.status === 429 || info.status >= 500;
  }
  // Unknown failures must not turn an existing session into a false logout.
  return true;
}

export function classifySessionClaims(
  hasVerifiedSubject: boolean,
  error: unknown,
): "authenticated" | "anonymous" | "unavailable" {
  if (error) return isTransientAuthFailure(error) ? "unavailable" : "anonymous";
  return hasVerifiedSubject ? "authenticated" : "anonymous";
}

const AUTH_CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

export function copySessionCacheHeaders(source: Headers, target: Headers) {
  for (const name of AUTH_CACHE_HEADERS) {
    const value = source.get(name);
    if (value !== null) target.set(name, value);
  }
}

export function applySessionRefreshHeaders(
  target: Headers,
  headers: Record<string, string> | undefined,
) {
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (AUTH_CACHE_HEADERS.some((name) => name === key.toLowerCase())) {
        target.set(key, value);
      }
    }
  }
  // Fail closed even if a provider version omits refresh cache headers.
  target.set("Cache-Control", "private, no-store");
}
