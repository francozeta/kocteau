import { normalizeAppleMusicArtwork } from "./artwork";
import type { AppleMusicApiPlaylistPayload } from "./fetcher";
import type {
  AppleMusicPlaylistMetadata,
  AppleMusicPlaylistTrack,
  AppleMusicPlaylistUrlParts,
} from "./types";

export function normalizeAppleMusicApiPlaylist(
  payload: AppleMusicApiPlaylistPayload,
  parts: AppleMusicPlaylistUrlParts,
) {
  const playlist: AppleMusicPlaylistMetadata = {
    title: payload.playlist.attributes?.name ?? null,
    curator: payload.playlist.attributes?.curatorName ?? null,
    appleMusicId: payload.playlist.id,
    appleMusicUrl: payload.playlist.attributes?.url ?? parts.originalUrl,
    storefront: parts.storefront,
    trackCount: payload.playlist.attributes?.trackCount ?? payload.tracks.length,
    durationText: null,
    artwork: normalizeAppleMusicArtwork(payload.playlist.attributes?.artwork),
    isPublic: true,
  };

  const tracks: AppleMusicPlaylistTrack[] = payload.tracks.flatMap((item, index) => {
    const title = item.attributes?.name;

    if (!item.id || !title) {
      return [];
    }

    return [
      {
        title,
        artist: item.attributes?.artistName ?? null,
        album: item.attributes?.albumName ?? null,
        durationMs: item.attributes?.durationInMillis ?? null,
        appleMusicUrl: item.attributes?.url ?? null,
        appleMusicId: item.id,
        artistAppleMusicId: item.relationships?.artists?.data?.[0]?.id ?? null,
        albumAppleMusicId: item.relationships?.albums?.data?.[0]?.id ?? null,
        position: index + 1,
        artwork: normalizeAppleMusicArtwork(item.attributes?.artwork),
      },
    ];
  });

  return { playlist, tracks };
}

export function normalizeKocteauImportDraft(
  playlist: AppleMusicPlaylistMetadata,
  tracks: AppleMusicPlaylistTrack[],
) {
  return {
    playlist: {
      source: "apple_music" as const,
      provider_id: playlist.appleMusicId,
      title: playlist.title,
      curator: playlist.curator,
      external_url: playlist.appleMusicUrl,
      track_count: tracks.length,
      artwork_url: playlist.artwork.url,
    },
    entities: tracks.map((track) => ({
      provider: "apple_music" as const,
      provider_id: track.appleMusicId,
      type: "track" as const,
      title: track.title,
      artist_name: track.artist,
      cover_url: track.artwork.url,
      external_url: track.appleMusicUrl,
      metadata: {
        album: track.album,
        albumAppleMusicId: track.albumAppleMusicId,
        artistAppleMusicId: track.artistAppleMusicId,
        durationMs: track.durationMs,
        playlistPosition: track.position,
      },
    })),
  };
}
