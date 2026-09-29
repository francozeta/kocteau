export type RecordingIdentity = {
  title: string;
  artistName: string | null;
  isrc?: string | null;
  durationSeconds?: number | null;
};

export type RecordingCandidate = {
  id: string;
  title: string;
  score?: number;
  length?: number;
  disambiguation?: string;
  isrcs?: string[];
  "artist-credit"?: Array<{ name?: string; joinphrase?: string; artist?: { name?: string } }>;
};

export function normalizeCatalogText(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function normalizeIsrc(value: string | null | undefined) {
  const normalized = value?.replace(/[\s-]/g, "").toUpperCase();
  return normalized && /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(normalized) ? normalized : null;
}

export function selectRecordingMatch<T extends RecordingCandidate>(
  candidates: T[] | undefined, identity: RecordingIdentity,
): T | null {
  const title = normalizeCatalogText(identity.title);
  const artist = normalizeCatalogText(identity.artistName ?? "");
  const isrc = normalizeIsrc(identity.isrc);
  if (!title || !artist) return null;

  const matches = (candidates ?? []).filter((candidate) => {
    if ((candidate.score ?? 0) < 85 || normalizeCatalogText(candidate.title) !== title) return false;
    const credit = (candidate["artist-credit"] ?? [])
      .map((part) => `${part.name ?? part.artist?.name ?? ""}${part.joinphrase ?? ""}`).join("");
    if (normalizeCatalogText(credit) !== artist) return false;
    if (isrc && !candidate.isrcs?.some((value) => normalizeIsrc(value) === isrc)) return false;
    if (identity.durationSeconds && candidate.length &&
        Math.abs(candidate.length / 1_000 - identity.durationSeconds) > 5) return false;

    // A high search score is not evidence that a live/edit/remix is the selected recording.
    const context = normalizeCatalogText(candidate.disambiguation ?? "");
    for (const version of ["live", "remix", "demo", "instrumental", "karaoke", "edit", "acoustic"]) {
      if (new RegExp(`\\b${version}\\b`).test(context) && !new RegExp(`\\b${version}\\b`).test(title)) return false;
    }
    return true;
  });

  // Do not choose an arbitrary row when the sources still disagree on identity.
  return matches.length === 1 ? matches[0] : null;
}
