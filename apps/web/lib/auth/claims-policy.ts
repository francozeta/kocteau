type AuthFailure = {
  name?: string;
  code?: string;
  status?: number;
};

// Recognize only explicit session-invalid conditions as logout. Other errors,
// including 429/5xx and unknown transport failures, are temporary/unverified.
const INVALID_SESSION_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "invalid_refresh_token",
  "invalid_grant",
  "session_not_found",
  "session_expired",
  "bad_jwt",
  "invalid_jwt",
]);

export function classifyAuthClaims(
  subject: unknown,
  error: AuthFailure | null | undefined,
): "authenticated" | "anonymous" | "unavailable" {
  if (!error) {
    return typeof subject === "string" && subject.length > 0
      ? "authenticated"
      : "anonymous";
  }

  if (error.name === "AuthSessionMissingError") return "anonymous";

  // 5xx/429 must never become a silent logout even when the error has a
  // generic code. SDK transport errors commonly carry status 0 or undefined.
  if (error.status === 429 || (error.status != null && error.status >= 500)) {
    return "unavailable";
  }
  if (error.code && INVALID_SESSION_CODES.has(error.code)) {
    return "anonymous";
  }
  return "unavailable";
}
