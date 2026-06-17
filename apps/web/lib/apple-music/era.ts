export function getEraSlugFromReleaseDate(releaseDate: string | null | undefined) {
  if (!releaseDate) {
    return null;
  }

  const year = Number.parseInt(releaseDate.slice(0, 4), 10);

  if (!Number.isFinite(year)) {
    return null;
  }

  if (year < 1970) return "pre-1970s";
  if (year < 1980) return "1970s";
  if (year < 1990) return "1980s";
  if (year < 2000) return "1990s";
  if (year < 2010) return "2000s";
  if (year < 2020) return "2010s";

  return "2020s";
}
