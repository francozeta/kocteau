export function createStarterRotationSeed(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const hourSlot = Math.floor(now.getUTCHours() / 3);

  return `${day}:${hourSlot}`;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function rotateStarterTracks<T extends { id: string; provider_id?: string | null }>(
  tracks: readonly T[],
  seed: string,
) {
  return tracks
    .map((track, index) => ({
      index,
      score: hashString(`${seed}:${track.id}:${track.provider_id ?? ""}`),
      track,
    }))
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map(({ track }) => track);
}
