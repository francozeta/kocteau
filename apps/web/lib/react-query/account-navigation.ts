const reconciliationKey = "kocteau:auth-reconciliation";

export function accountTransitionPath({
  serverAccountId,
  browserAccountId,
  event,
  currentPath,
  storage,
}: {
  serverAccountId: string | null;
  browserAccountId: string | null;
  event: string;
  currentPath: string;
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
}) {
  if (serverAccountId === browserAccountId) {
    try { storage?.removeItem(reconciliationKey); } catch {}
    return null;
  }
  if (!browserAccountId) return "/login";
  if (event !== "INITIAL_SESSION") return currentPath;

  // A repeated server/browser mismatch must not reload a private page forever.
  const mismatch = JSON.stringify([serverAccountId, browserAccountId]);
  try {
    if (!storage || storage.getItem(reconciliationKey) === mismatch) return "/home";
    storage.setItem(reconciliationKey, mismatch);
    return currentPath;
  } catch {
    return "/home";
  }
}
