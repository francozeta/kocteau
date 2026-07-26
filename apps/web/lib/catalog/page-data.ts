import "server-only";

import {
  getDeezerAlbum,
  getDeezerAlbumTracks,
  getDeezerArtist,
  getDeezerArtistAlbums,
  getDeezerArtistTopTracks,
} from "@/lib/deezer";
import type { ArtistPage } from "@/lib/queries/artists";
import type { EntityPage } from "@/lib/queries/entities";

export async function getAlbumPageData(entity: EntityPage) {
  const album = await getDeezerAlbum(entity.provider_id);
  const artistId = album?.artist_id;
  const artistName = album?.artist_name ?? entity.artist_name;
  const tracks =
    album && artistId && artistName
      ? await getDeezerAlbumTracks(
          album,
          { id: artistId, name: artistName, fan_count: null },
          18,
        )
      : [];

  return {
    title: album?.title ?? entity.title,
    artistName,
    coverUrl: album?.cover_url ?? entity.cover_url,
    releaseDate: album?.release_date ?? entity.release_date,
    recordType: album?.record_type ?? entity.record_type,
    genres: entity.genres,
    tracks,
  };
}

export async function getDeezerAlbumPageData(providerId: string) {
  const album = await getDeezerAlbum(providerId);

  if (!album) {
    return null;
  }

  const tracks =
    album.artist_id && album.artist_name
      ? await getDeezerAlbumTracks(
          album,
          { id: album.artist_id, name: album.artist_name, fan_count: null },
          18,
        )
      : [];

  return { album, tracks };
}

export async function getArtistPageData(artist: ArtistPage) {
  const deezerArtist = await getDeezerArtist(artist.provider_id);
  const artistIdentity = deezerArtist ?? {
    provider: "deezer" as const,
    id: artist.provider_id,
    name: artist.name,
    fan_count: null,
    picture_url: artist.image_url,
    deezer_url: artist.deezer_url,
  };
  const [albums, tracks] = await Promise.all([
    getDeezerArtistAlbums(artist.provider_id, 12),
    getDeezerArtistTopTracks(artistIdentity, 12),
  ]);

  return { artist: artistIdentity, albums, tracks };
}

export async function getDeezerArtistPageData(providerId: string) {
  const artist = await getDeezerArtist(providerId);

  if (!artist) {
    return null;
  }

  const [albums, tracks] = await Promise.all([
    getDeezerArtistAlbums(providerId, 12),
    getDeezerArtistTopTracks(artist, 12),
  ]);

  return { artist, albums, tracks };
}
