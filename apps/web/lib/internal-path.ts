export function safeInternalPath(value: string | null | undefined) {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  ) {
    return null;
  }

  const url = new URL(value, "https://kocteau.local");
  if (url.origin !== "https://kocteau.local" || url.pathname.startsWith("//")) {
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
