import type { AppleMusicPlaylistImportResult } from "./types";

export function exportAppleMusicPlaylistJson(
  result: AppleMusicPlaylistImportResult,
  pretty = true,
) {
  return JSON.stringify(result, null, pretty ? 2 : 0);
}
