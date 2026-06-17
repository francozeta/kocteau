export type AppleMusicPlaylistUrlParts = {
  originalUrl: string;
  storefront: string;
  playlistId: string;
  slug: string | null;
  isCatalogPlaylist: boolean;
};

export type AppleMusicArtwork = {
  url: string | null;
  templateUrl: string | null;
  width: number | null;
  height: number | null;
  bgColor: string | null;
  textColor1: string | null;
  textColor2: string | null;
};

export type AppleMusicPlaylistTrack = {
  title: string;
  artist: string | null;
  album: string | null;
  durationMs: number | null;
  appleMusicUrl: string | null;
  appleMusicId: string;
  artistAppleMusicId: string | null;
  albumAppleMusicId: string | null;
  position: number;
  artwork: AppleMusicArtwork;
};

export type AppleMusicPlaylistMetadata = {
  title: string | null;
  curator: string | null;
  appleMusicId: string;
  appleMusicUrl: string;
  storefront: string;
  trackCount: number | null;
  durationText: string | null;
  artwork: AppleMusicArtwork;
  isPublic: boolean;
};

export type KocteauEntityImportDraft = {
  provider: "apple_music";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  external_url: string | null;
  metadata: {
    album: string | null;
    albumAppleMusicId: string | null;
    artistAppleMusicId: string | null;
    durationMs: number | null;
    playlistPosition: number;
  };
};

export type KocteauPlaylistImportDraft = {
  source: "apple_music";
  provider_id: string;
  title: string | null;
  curator: string | null;
  external_url: string;
  track_count: number;
  artwork_url: string | null;
};

export type AppleMusicPlaylistImportResult = {
  importedAt: string;
  source: {
    provider: "apple_music";
    url: string;
    storefront: string;
    playlistId: string;
    strategy: "public-html" | "apple-music-api" | "metadata-only";
    requiresAppleMusicDeveloperToken: boolean;
  };
  playlist: AppleMusicPlaylistMetadata;
  tracks: AppleMusicPlaylistTrack[];
  kocteau: {
    playlist: KocteauPlaylistImportDraft;
    entities: KocteauEntityImportDraft[];
  };
  warnings: string[];
};
