import {
  fetchAppleMusicPlaylistFromApi,
  fetchAppleMusicPlaylistHtml,
} from "./fetcher";
import { normalizeAppleMusicApiPlaylist, normalizeKocteauImportDraft } from "./normalizer";
import { parseAppleMusicPlaylistHtml } from "./parser";
import { parseAppleMusicPlaylistUrl } from "./playlist-url";
import type {
  AppleMusicPlaylistImportResult,
  AppleMusicPlaylistMetadata,
  AppleMusicPlaylistTrack,
} from "./types";

export type ImportAppleMusicPlaylistOptions = {
  developerToken?: string | null;
  preferApi?: boolean;
};

type ParsedAppleMusicPlaylist = {
  playlist: AppleMusicPlaylistMetadata;
  tracks: AppleMusicPlaylistTrack[];
};

export async function importAppleMusicPlaylist(
  url: string,
  options: ImportAppleMusicPlaylistOptions = {},
): Promise<AppleMusicPlaylistImportResult> {
  const parts = parseAppleMusicPlaylistUrl(url);
  const warnings: string[] = [];
  const developerToken = options.developerToken ?? process.env.APPLE_MUSIC_DEVELOPER_TOKEN ?? null;

  let strategy: AppleMusicPlaylistImportResult["source"]["strategy"] = "metadata-only";
  let parsed: ParsedAppleMusicPlaylist | null = null;

  if (!options.preferApi) {
    const htmlResponse = await fetchAppleMusicPlaylistHtml(parts.originalUrl);
    parsed = parseAppleMusicPlaylistHtml(htmlResponse.html, {
      ...parts,
      originalUrl: htmlResponse.finalUrl || parts.originalUrl,
    });

    if (parsed.tracks.length > 0) {
      strategy = "public-html";
    } else {
      warnings.push(
        "Apple Music public HTML did not expose track rows. Use APPLE_MUSIC_DEVELOPER_TOKEN to fetch tracks from the Apple Music API.",
      );
    }
  }

  if ((options.preferApi || !parsed?.tracks.length) && developerToken) {
    const apiPayload = await fetchAppleMusicPlaylistFromApi(parts, developerToken);
    parsed = normalizeAppleMusicApiPlaylist(apiPayload, parts);
    strategy = "apple-music-api";
  }

  if (!parsed) {
    const htmlResponse = await fetchAppleMusicPlaylistHtml(parts.originalUrl);
    parsed = parseAppleMusicPlaylistHtml(htmlResponse.html, parts);
  }

  if (parsed.tracks.length === 0 && !developerToken) {
    warnings.push(
      "No APPLE_MUSIC_DEVELOPER_TOKEN was provided, so Kocteau could only return public playlist metadata.",
    );
  }

  const kocteau = normalizeKocteauImportDraft(parsed.playlist, parsed.tracks);

  return {
    importedAt: new Date().toISOString(),
    source: {
      provider: "apple_music",
      url: parts.originalUrl,
      storefront: parts.storefront,
      playlistId: parts.playlistId,
      strategy,
      requiresAppleMusicDeveloperToken: parsed.tracks.length === 0 || strategy === "apple-music-api",
    },
    playlist: parsed.playlist,
    tracks: parsed.tracks,
    kocteau,
    warnings,
  };
}
