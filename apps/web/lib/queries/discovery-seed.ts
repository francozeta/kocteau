import { getDeezerAlbum, getDeezerArtist, getDeezerTrack } from "@/lib/deezer";
import type { DiscoverySeed } from "@/lib/discovery/seed";
import type { SearchEntityType } from "@/lib/search-types";

export async function getDiscoverySeed(
  type: SearchEntityType,
  providerId: string,
): Promise<DiscoverySeed | null> {
  if (type === "track") {
    const track = await getDeezerTrack(providerId);

    return track
      ? {
          id: `deezer:track:${track.provider_id}`,
          entityId: null,
          provider_id: track.provider_id,
          type: "track",
          title: track.title,
          artist_name: track.artist_name,
          artist_provider_id: track.artist_id,
          cover_url: track.cover_url,
        }
      : null;
  }

  if (type === "album") {
    const album = await getDeezerAlbum(providerId);

    return album
      ? {
          id: `deezer:album:${album.id}`,
          entityId: null,
          provider_id: album.id,
          type: "album",
          title: album.title,
          artist_name: album.artist_name,
          artist_provider_id: album.artist_id,
          cover_url: album.cover_url,
        }
      : null;
  }

  const artist = await getDeezerArtist(providerId);

  return artist
    ? {
        id: `deezer:artist:${artist.id}`,
        entityId: null,
        provider_id: artist.id,
        type: "artist",
        title: artist.name,
        artist_name: null,
        artist_provider_id: artist.id,
        cover_url: artist.picture_url,
      }
    : null;
}
