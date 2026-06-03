import { NextResponse } from "next/server";
import { requireStarterCurator } from "@/lib/curation/access";
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
import {
  buildStarterCandidateTracks,
  type StarterCandidateSource,
} from "@/lib/starter/candidates";
import { starterCandidateQuerySchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

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

async function getRelatedSeedTracks({
  query,
  limit,
}: {
  query: string;
  limit: number;
}) {
  const seedArtists = await searchDeezerArtists(query, 2);
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

async function getDeepCutTracks({
  query,
  limit,
}: {
  query: string;
  limit: number;
}) {
  const [seedArtist] = await searchDeezerArtists(query, 1);

  if (!seedArtist) {
    return {
      seedLabel: query,
      tracks: await searchDeezerTracks(query, limit),
    };
  }

  const [topTracks, albums] = await Promise.all([
    getDeezerArtistTopTracks(seedArtist, 12),
    getDeezerArtistAlbums(seedArtist.id, 10),
  ]);
  const topHitIds = new Set(topTracks.slice(0, 5).map((track) => track.provider_id));
  const albumTracks = await Promise.all(
    albums
      .filter((album) => album.record_type === null || album.record_type === "album")
      .slice(0, 5)
      .map((album) => getDeezerAlbumTracks(album, seedArtist, 12)),
  );

  return {
    seedLabel: seedArtist.name,
    tracks: dedupeTracks(albumTracks.flat()).filter(
      (track) => !topHitIds.has(track.provider_id),
    ),
  };
}

async function getCandidateSourceTracks({
  mode,
  query,
  limit,
}: {
  mode: StarterCandidateSource;
  query: string;
  limit: number;
}) {
  if (mode === "deep-cut") {
    return getDeepCutTracks({ query, limit });
  }

  return getRelatedSeedTracks({ query, limit });
}

export async function GET(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const { searchParams } = new URL(req.url);
  const parsed = starterCandidateQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    mode: searchParams.get("mode") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Candidate search is invalid.");
  }

  const { q, mode, limit } = parsed.data;
  const activeStarterResult = await curator.supabase
    .from("starter_tracks")
    .select("provider_id")
    .eq("provider", "deezer")
    .eq("is_active", true);

  if (activeStarterResult.error) {
    return NextResponse.json(
      { error: "We could not check active starter picks." },
      { status: 500 },
    );
  }

  const existingProviderIds = new Set(
    (activeStarterResult.data ?? []).flatMap((track) =>
      track.provider_id ? [track.provider_id] : [],
    ),
  );
  const sourceTracks = await getCandidateSourceTracks({
    mode,
    query: q,
    limit,
  });
  const candidates = buildStarterCandidateTracks({
    source: mode,
    seedLabel: sourceTracks.seedLabel,
    tracks: sourceTracks.tracks,
    existingProviderIds,
    limit,
  });

  return NextResponse.json({
    mode,
    query: q,
    seed_label: sourceTracks.seedLabel,
    tracks: candidates,
  });
}
