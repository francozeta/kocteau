export const catalogSearchBudgetMs = 3_000;

/** One budget covers provider requests, retries, backoff, and artist enrichment. */
export async function withSearchDeadline<T>(
  run: (signal: AbortSignal) => Promise<T>,
  { signal, timeoutMs = catalogSearchBudgetMs }: {
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  signal?.throwIfAborted();
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(
    () => controller.abort(new DOMException("Catalog search deadline exceeded", "TimeoutError")),
    timeoutMs,
  );

  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
