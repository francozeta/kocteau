import type { DeezerAlbumResult, DeezerTrackResult } from "@/lib/deezer";
import type { MusicBrainzArtistMatch, MusicBrainzEntityMatch } from "./musicbrainz";
import { catalogFacts, type ResolvedCatalogSource } from "./source-evidence";

export function normalizeDeezerTrack(track: DeezerTrackResult): ResolvedCatalogSource {
  return {
    sourceEntityId: track.provider_id,
    matchScore: null,
    facts: catalogFacts({
      title: track.title,
      artist_name: track.artist_name,
      artist_id: track.artist_id,
      album_id: track.album_id,
      album_title: track.album_title,
      album_record_type: track.album_record_type,
      release_date: track.release_date,
      isrc: track.isrc,
      duration_seconds: track.duration_seconds,
      cover_url: track.cover_url,
      deezer_url: track.deezer_url,
    }),
  };
}

export function normalizeDeezerAlbum(album: DeezerAlbumResult): ResolvedCatalogSource {
  return {
    sourceEntityId: album.id,
    matchScore: null,
    facts: catalogFacts({
      title: album.title,
      album_id: album.id,
      artist_name: album.artist_name,
      artist_id: album.artist_id,
      record_type: album.record_type,
      release_date: album.release_date,
      tags: album.genres,
      cover_url: album.cover_url,
      deezer_url: album.deezer_url,
    }),
  };
}

export function normalizeMusicBrainzArtist(artist: MusicBrainzArtistMatch): ResolvedCatalogSource {
  return {
    sourceEntityId: artist.id,
    matchScore: artist.score,
    facts: catalogFacts({
      artist_type: artist.type,
      country_code: artist.countryCode,
      disambiguation: artist.disambiguation,
      life_span_begin: artist.lifeSpanBegin,
      life_span_end: artist.lifeSpanEnd,
      tags: artist.genres,
    }),
  };
}

export function normalizeMusicBrainzEntity(entity: MusicBrainzEntityMatch): ResolvedCatalogSource {
  return {
    sourceEntityId: entity.id,
    matchScore: entity.score,
    facts: catalogFacts({
      disambiguation: entity.disambiguation,
      first_release_date: entity.firstReleaseDate,
      record_type: entity.recordType,
      tags: entity.genres,
      prominent_tags: entity.prominentTags ?? [],
      matched_title: entity.matchedTitle,
      matched_artist: entity.matchedArtist,
      match_method: entity.matchMethod,
    }),
  };
}
