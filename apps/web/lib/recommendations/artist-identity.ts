export function getArtistIdentity(
  providerId: string | null | undefined,
  name: string | null | undefined,
) {
  if (providerId) return `deezer:artist:${providerId}`;
  const label = name?.trim().toLowerCase();
  return label ? `name:${label}` : "";
}
