export function safeInternalPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function appendInternalNext(path: string, nextPath: string | null | undefined) {
  const safeNextPath = safeInternalPath(nextPath);

  if (!safeNextPath) {
    return path;
  }

  const url = new URL(path, "https://kocteau.local");
  url.searchParams.set("next", safeNextPath);

  return `${url.pathname}${url.search}${url.hash}`;
}
