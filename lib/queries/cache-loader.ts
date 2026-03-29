export function getOrCreateLoader<T>(
  store: Map<string, () => Promise<T>>,
  keyParts: readonly unknown[],
  create: () => () => Promise<T>,
) {
  const cacheKey = JSON.stringify(keyParts);
  const existing = store.get(cacheKey);

  if (existing) {
    return existing;
  }

  const loader = create();
  store.set(cacheKey, loader);
  return loader;
}
