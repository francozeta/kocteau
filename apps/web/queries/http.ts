export class FetchJsonError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FetchJsonError";
    this.status = status;
  }
}

export function isRetryableFetchJsonError(error: unknown) {
  return (
    error instanceof FetchJsonError &&
    (error.status === 408 || error.status === 429 || error.status >= 500)
  );
}

export async function fetchJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const fallbackMessage =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : null;

    throw new FetchJsonError(
      typeof fallbackMessage === "string" && fallbackMessage
        ? fallbackMessage
        : "We couldn't load that data right now.",
      response.status,
    );
  }

  return payload as T;
}
