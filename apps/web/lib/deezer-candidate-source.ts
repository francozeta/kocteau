import {
  getDeezerAlbumTracks,
  getDeezerArtistAlbums,
  getDeezerArtistTopTracks,
  getDeezerRelatedArtists,
  searchDeezerArtists,
  searchDeezerTracks,
  type DeezerArtistResult,
  type DeezerTrackResult,
} from "@/lib/deezer";
import type { StarterCandidateSource } from "@/lib/starter/candidates";

export type DeezerCandidateSeedArtist = Pick<
  DeezerArtistResult,
  "id" | "name" | "fan_count"
>;

function dedupeArtists(artists: DeezerArtistResult[]) {
  const seenArtistIds = new Set<string>();

  return artists.filter((artist) => {
    if (seenArtistIds.has(artist.id)) {
      return false;
    }

    seenArtistIds.add(artist.id);
    return true;
  });
}

function dedupeTracks(tracks: DeezerTrackResult[]) {
  const seenProviderIds = new Set<string>();

  return tracks.filter((track) => {
    if (seenProviderIds.has(track.provider_id)) {
      return false;
    }

    seenProviderIds.add(track.provider_id);
    return true;
  });
}

async function getSeedArtists({
  query,
  limit,
  seedArtist,
}: {
  query: string;
  limit: number;
  seedArtist?: DeezerCandidateSeedArtist | null;
}) {
  if (seedArtist) {
    return [
      {
        provider: "deezer" as const,
        id: seedArtist.id,
        name: seedArtist.name,
        fan_count: seedArtist.fan_count,
        picture_url: null,
        deezer_url: null,
      },
    ];
  }

  return searchDeezerArtists(query, limit);
}

export async function getRelatedSeedTracks({
  query,
  limit,
  seedArtist,
}: {
  query: string;
  limit: number;
  seedArtist?: DeezerCandidateSeedArtist | null;
}) {
  const seedArtists = await getSeedArtists({ query, limit: 2, seedArtist });
  const seedArtistIds = new Set(seedArtists.map((artist) => artist.id));
  const relatedArtistGroups = await Promise.all(
    seedArtists.map((artist) => getDeezerRelatedArtists(artist.id, 8)),
  );
  const relatedArtists = dedupeArtists(relatedArtistGroups.flat())
    .filter((artist) => !seedArtistIds.has(artist.id))
    .slice(0, Math.max(limit, 6));
  const trackGroups = await Promise.all(
    relatedArtists.map((artist) => getDeezerArtistTopTracks(artist, 2)),
  );

  return {
    seedLabel: seedArtists[0]?.name ?? query,
    tracks: dedupeTracks(trackGroups.flat()),
  };
}

export async function getDeepCutTracks({
  query,
  limit,
  seedArtist,
}: {
  query: string;
  limit: number;
  seedArtist?: DeezerCandidateSeedArtist | null;
}) {
  const [resolvedSeedArtist] = await getSeedArtists({ query, limit: 1, seedArtist });

  if (!resolvedSeedArtist) {
    return {
      seedLabel: query,
      tracks: await searchDeezerTracks(query, limit),
    };
  }

  const [topTracks, albums] = await Promise.all([
    getDeezerArtistTopTracks(resolvedSeedArtist, 12),
    getDeezerArtistAlbums(resolvedSeedArtist.id, 10),
  ]);
  const topHitIds = new Set(topTracks.slice(0, 5).map((track) => track.provider_id));
  const albumTracks = await Promise.all(
    albums
      .filter((album) => album.record_type === null || album.record_type === "album")
      .slice(0, 5)
      .map((album) => getDeezerAlbumTracks(album, resolvedSeedArtist, 12)),
  );

  return {
    seedLabel: resolvedSeedArtist.name,
    tracks: dedupeTracks(albumTracks.flat()).filter(
      (track) => !topHitIds.has(track.provider_id),
    ),
  };
}

export async function getCandidateSourceTracks({
  mode,
  query,
  limit,
  seedArtist,
}: {
  mode: StarterCandidateSource;
  query: string;
  limit: number;
  seedArtist?: DeezerCandidateSeedArtist | null;
}) {
  if (mode === "deep-cut") {
    return getDeepCutTracks({ query, limit, seedArtist });
  }

  return getRelatedSeedTracks({ query, limit, seedArtist });
}
