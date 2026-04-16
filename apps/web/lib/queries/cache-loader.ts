const LOADER_TTL_MS = 15 * 60_000;
const MAX_LOADERS_PER_STORE = 250;
const loaderAccessTimes = new WeakMap<Map<string, unknown>, Map<string, number>>();

function getAccessTimeStore(store: Map<string, unknown>) {
  const existing = loaderAccessTimes.get(store);

  if (existing) {
    return existing;
  }

  const next = new Map<string, number>();
  loaderAccessTimes.set(store, next);
  return next;
}

function cleanupExpiredLoaders(
  store: Map<string, unknown>,
  accessTimes: Map<string, number>,
  now: number,
) {
  for (const [key, lastAccessAt] of accessTimes) {
    if (now - lastAccessAt <= LOADER_TTL_MS) {
      continue;
    }

    accessTimes.delete(key);
    store.delete(key);
  }
}

function evictOldestLoaders(
  store: Map<string, unknown>,
  accessTimes: Map<string, number>,
) {
  while (store.size >= MAX_LOADERS_PER_STORE) {
    const oldest = [...accessTimes.entries()].sort((left, right) => left[1] - right[1])[0];

    if (!oldest) {
      break;
    }

    const [oldestKey] = oldest;
    accessTimes.delete(oldestKey);
    store.delete(oldestKey);
  }
}

export function getOrCreateLoader<T>(
  store: Map<string, () => Promise<T>>,
  keyParts: readonly unknown[],
  create: () => () => Promise<T>,
) {
  const cacheKey = JSON.stringify(keyParts);
  const accessTimes = getAccessTimeStore(store as Map<string, unknown>);
  const now = Date.now();

  cleanupExpiredLoaders(store as Map<string, unknown>, accessTimes, now);
  const existing = store.get(cacheKey);

  if (existing) {
    accessTimes.set(cacheKey, now);
    return existing;
  }

  evictOldestLoaders(store as Map<string, unknown>, accessTimes);

  const loader = create();
  store.set(cacheKey, loader);
  accessTimes.set(cacheKey, now);
  return loader;
}
