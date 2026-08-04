export function isLegacyPresetAvatarUrl(value?: string | null) {
  return Boolean(value?.includes("/preset-") && value.includes(".svg"));
}

export function getAvatarThumbnailUrl(value?: string | null) {
  if (!value) {
    return value ?? null;
  }

  if (isLegacyPresetAvatarUrl(value)) {
    return null;
  }

  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(value, "https://kocteau.local");

    if (!url.pathname.includes("avatar-master.webp")) {
      return value;
    }

    url.pathname = url.pathname.replace("avatar-master.webp", "avatar-thumb.webp");

    return value.startsWith("http")
      ? url.toString()
      : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value.replace("avatar-master.webp", "avatar-thumb.webp");
  }
}
