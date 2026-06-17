import type { AppleMusicPlaylistUrlParts } from "./types";

export class AppleMusicPlaylistUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppleMusicPlaylistUrlError";
  }
}

export function parseAppleMusicPlaylistUrl(input: string): AppleMusicPlaylistUrlParts {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new AppleMusicPlaylistUrlError("Invalid Apple Music playlist URL.");
  }

  if (url.hostname !== "music.apple.com") {
    throw new AppleMusicPlaylistUrlError("Expected a music.apple.com URL.");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const playlistIndex = segments.indexOf("playlist");

  if (playlistIndex < 1) {
    throw new AppleMusicPlaylistUrlError("Expected an Apple Music playlist URL.");
  }

  const storefront = segments[0]?.toLowerCase();
  const slug = segments[playlistIndex + 1] ?? null;
  const playlistId = segments[playlistIndex + 2];

  if (!storefront || !playlistId) {
    throw new AppleMusicPlaylistUrlError("Apple Music playlist URL is missing storefront or playlist id.");
  }

  return {
    originalUrl: url.toString(),
    storefront,
    playlistId,
    slug,
    isCatalogPlaylist: playlistId.startsWith("pl."),
  };
}
