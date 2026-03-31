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

    throw new Error(
      typeof fallbackMessage === "string" && fallbackMessage
        ? fallbackMessage
        : "We couldn't load that data right now.",
    );
  }

  return payload as T;
}
