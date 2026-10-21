export type DeezerFetchOptions = {
  errorMessage: string;
  revalidate: number;
  retryDelays?: readonly number[];
  signal?: AbortSignal;
  timeoutMs?: number;
};

export class DeezerRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DeezerRequestError";
  }
}

export function getDeezerErrorDetails(error: unknown) {
  return {
    status: error instanceof DeezerRequestError ? error.status : null,
    message: error instanceof Error ? error.message : "Unknown Deezer error",
  };
}

function shouldRetry(error: unknown) {
  return !(error instanceof DeezerRequestError) ||
    error.status === null || error.status === 429 || error.status >= 500;
}

function waitForRetry(ms: number, signal?: AbortSignal) {
  signal?.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function fetchDeezerJson<T>(
  url: string,
  {
    errorMessage,
    revalidate,
    retryDelays = [],
    signal,
    timeoutMs = 8_000,
  }: DeezerFetchOptions,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    signal?.throwIfAborted();
    const controller = new AbortController();
    const onAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(
      () => controller.abort(new DOMException("Deezer request timed out", "TimeoutError")),
      timeoutMs,
    );

    try {
      const response = await fetch(url, {
        next: { revalidate },
        signal: controller.signal,
      });
      if (!response.ok) throw new DeezerRequestError(errorMessage, response.status);
      return await response.json() as T;
    } catch (error) {
      signal?.throwIfAborted();
      lastError = error;
      if (attempt === retryDelays.length || !shouldRetry(error)) break;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }

    await waitForRetry(retryDelays[attempt] ?? 0, signal);
  }

  if (lastError instanceof DeezerRequestError) throw lastError;
  throw new DeezerRequestError(errorMessage, null, lastError);
}
