import "server-only";

import { unstable_cache } from "next/cache";
import { withSearchDeadline } from "./deadline";

export type LookupStatus = "fresh" | "stale" | "degraded" | "skipped";
type Snapshot<T> = { value: T; refreshedAt: number };

export function normalizeCatalogQuery(query: string) {
  // ILIKE is case-insensitive. Preserve non-ASCII text and internal whitespace.
  return query.trim().replace(/[A-Z]/g, (letter) => letter.toLowerCase());
}

export function createPublicLookup<Args extends unknown[], Value>(
  load: (signal: AbortSignal, ...args: Args) => Promise<Value>,
  keyParts: string[],
  { tags, timeoutMs = 3_000 }: { tags: string[]; timeoutMs?: number },
) {
  const inFlight = new Map<string, Promise<Snapshot<Value>>>();
  const failures = new Map<string, { error: unknown; until: number }>();
  const refreshMs = 60_000;
  const cached = unstable_cache(async (...args: Args) => {
    const key = JSON.stringify(args);
    const existing = inFlight.get(key);
    if (existing) return existing;
    const failure = failures.get(key);
    if (failure && failure.until > Date.now()) throw failure.error;
    if (inFlight.size >= 128) throw new Error("Public lookup refresh capacity exceeded");

    const pending = withSearchDeadline(
      (signal) => load(signal, ...args),
      { timeoutMs },
    ).then((value) => {
      failures.delete(key);
      return { value, refreshedAt: Date.now() };
    }).catch((error: unknown) => {
      if (failures.size >= 256) failures.delete(failures.keys().next().value!);
      failures.set(key, { error, until: Date.now() + 1_000 });
      throw error;
    }).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, pending);
    return pending;
  }, keyParts, { revalidate: refreshMs / 1000, tags });

  return async (...args: Args): Promise<Snapshot<Value> & { status: LookupStatus }> => {
    const snapshot = await cached(...args);
    const failure = failures.get(JSON.stringify(args));
    return {
      ...snapshot,
      status: failure && failure.until > Date.now()
        ? "degraded"
        : Date.now() - snapshot.refreshedAt >= refreshMs ? "stale" : "fresh",
    };
  };
}
