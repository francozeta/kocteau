// Pure policy: keep schema compatibility separate from transport failures.
export const VIEWER_CONTEXT_READ_BUDGET_MS = 3_000;

export function isLegacyTasteOnboardedColumnError(
  error: { code?: string | null; message?: string | null },
): boolean {
  return (
    (error.code === "42703" || error.code === "PGRST204") &&
    /\btaste_onboarded\b/i.test(error.message ?? "")
  );
}
