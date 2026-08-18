import { NextResponse } from "next/server";
import {
  getDeezerArtistTopTracks,
  getDeezerErrorDetails,
  searchDeezerAlbums,
  searchDeezerArtists,
  searchDeezerTracks,
  type DeezerTrackResult,
} from "@/lib/deezer";
import {
  isStrongArtistSearchMatch,
  rankKocteauTrackSearchResults,
  type KocteauTrackSearchCandidate,
} from "@/lib/search/kocteau-first";
import { supabasePublic } from "@/lib/supabase/public";
import { kocteauSearchQuerySchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

type LocalEntityRow = {
  id: string;
  provider: string;
  provider_id: string;
  type: "track" | "album";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  release_date: string | null;
  record_type: string | null;
  disambiguation: string | null;
  first_release_date: string | null;
  genres: string[];
};

type LocalArtistRow = {
  id: string;
  provider: string;
  provider_id: string;
  name: string;
  image_url: string | null;
  deezer_url: string | null;
  artist_type: string | null;
  country_code: string | null;
  disambiguation: string | null;
  genres: string[];
};

type StarterTrackRow = {
  id: string;
  provider: string;
  provider_id: string;
  type: "track" | "album";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
};

type EntityLinkRow = {
  id: string;
  provider_id: string;
};

const localSearchLimit = 18;
const deezerSearchLimit = 18;
const artistMatchLimit = 12;
const responseLimit = 28;
const groupedTrackLimit = 8;
const groupedAlbumLimit = 4;
const groupedArtistLimit = 3;

function toIlikePattern(query: string) {
  return `%${query.replace(/[\\%_]/g, "\\$&")}%`;
}

function dedupeByProviderId<T extends { provider_id: string }>(rows: T[]) {
  const byProviderId = new Map<string, T>();

  for (const row of rows) {
    const providerId = row.provider_id.trim().toLowerCase();

    if (!byProviderId.has(providerId)) {
      byProviderId.set(providerId, row);
    }
  }

  return Array.from(byProviderId.values());
}

function mapLocalEntityCandidate(
  row: LocalEntityRow,
  sourceIndex: number,
): KocteauTrackSearchCandidate {
  return {
    provider: "deezer",
    provider_id: row.provider_id,
    type: row.type,
    title: row.title,
    artist_name: row.artist_name,
    cover_url: row.cover_url,
    deezer_url: row.deezer_url,
    entity_id: row.id,
    release_date: row.release_date,
    album_record_type: row.record_type,
    disambiguation: row.disambiguation,
    first_release_date: row.first_release_date,
    genres: row.genres,
    source: "local",
    source_index: sourceIndex,
  };
}

function mapLocalArtistCandidate(
  row: LocalArtistRow,
  sourceIndex: number,
): KocteauTrackSearchCandidate {
  return {
    provider: "deezer",
    provider_id: row.provider_id,
    type: "artist",
    title: row.name,
    artist_name: null,
    cover_url: row.image_url,
    deezer_url: row.deezer_url,
    entity_id: row.id,
    artist_type: row.artist_type,
    country_code: row.country_code,
    disambiguation: row.disambiguation,
    genres: row.genres,
    source: "local",
    source_index: sourceIndex,
  };
}

function mapStarterTrackCandidate(
  row: StarterTrackRow,
  sourceIndex: number,
): KocteauTrackSearchCandidate {
  return {
    provider: "deezer",
    provider_id: row.provider_id,
    type: "track",
    title: row.title,
    artist_name: row.artist_name,
    cover_url: row.cover_url,
    deezer_url: row.deezer_url,
    source: "starter",
    source_index: sourceIndex,
  };
}

function mapDeezerTrackCandidate({
  track,
  source,
  sourceIndex,
}: {
  track: DeezerTrackResult;
  source: "artist-match" | "deezer";
  sourceIndex: number;
}): KocteauTrackSearchCandidate {
  return {
    provider: "deezer",
    provider_id: track.provider_id,
    type: "track",
    title: track.title,
    artist_name: track.artist_name,
    artist_provider_id: track.artist_id,
    artist_picture_url: track.artist_picture_url,
    album_provider_id: track.album_id,
    album_title: track.album_title,
    album_deezer_url: track.album_deezer_url,
    album_record_type: track.album_record_type,
    release_date: track.release_date ?? null,
    cover_url: track.cover_url,
    deezer_url: track.deezer_url,
    source,
    source_index: sourceIndex,
    rank: track.rank ?? null,
  };
}

function mapDeezerAlbumCandidate(
  album: Awaited<ReturnType<typeof searchDeezerAlbums>>[number],
  sourceIndex: number,
): KocteauTrackSearchCandidate {
  return {
    provider: "deezer",
    provider_id: album.id,
    type: "album",
    title: album.title,
    artist_name: album.artist_name,
    artist_provider_id: album.artist_id,
    cover_url: album.cover_url,
    deezer_url: album.deezer_url,
    release_date: album.release_date,
    album_record_type: album.record_type,
    source: "deezer",
    source_index: sourceIndex,
  };
}

function mapDeezerArtistCandidate(
  artist: Awaited<ReturnType<typeof searchDeezerArtists>>[number],
  sourceIndex: number,
): KocteauTrackSearchCandidate {
  return {
    provider: "deezer",
    provider_id: artist.id,
    type: "artist",
    title: artist.name.trim(),
    artist_name: null,
    cover_url: artist.picture_url,
    deezer_url: artist.deezer_url,
    source: "deezer",
    source_index: sourceIndex,
    rank: artist.fan_count,
  };
}

function mapSearchResponse(result: ReturnType<typeof rankKocteauTrackSearchResults>[number]) {
  return {
    provider: result.provider,
    provider_id: result.provider_id,
    type: result.type,
    title: result.title,
    artist_name: result.artist_name,
    artist_provider_id: result.artist_provider_id ?? null,
    artist_picture_url: result.artist_picture_url ?? null,
    album_provider_id: result.album_provider_id ?? null,
    album_title: result.album_title ?? null,
    album_deezer_url: result.album_deezer_url ?? null,
    album_record_type: result.album_record_type ?? null,
    release_date: result.release_date ?? null,
    artist_type: result.artist_type ?? null,
    country_code: result.country_code ?? null,
    disambiguation: result.disambiguation ?? null,
    first_release_date: result.first_release_date ?? null,
    genres: result.genres ?? [],
    cover_url: result.cover_url,
    deezer_url: result.deezer_url,
    entity_id: result.entity_id ?? null,
    source: result.source,
    source_label: result.source_label,
    score: result.score,
  };
}

async function getLocalEntityCandidates(query: string) {
  const supabase = supabasePublic();
  const pattern = toIlikePattern(query);
  const baseSelect = "id, provider, provider_id, type, title, artist_name, cover_url, deezer_url, release_date, record_type, disambiguation, first_release_date, genres";

  const [titleResult, artistResult] = await Promise.all([
    supabase
      .from("entities")
      .select(baseSelect)
      .eq("provider", "deezer")
      .eq("type", "track")
      .ilike("title", pattern)
      .limit(localSearchLimit),
    supabase
      .from("entities")
      .select(baseSelect)
      .eq("provider", "deezer")
      .eq("type", "track")
      .ilike("artist_name", pattern)
      .limit(localSearchLimit),
  ]);

  if (titleResult.error) {
    console.warn("[search.local_entities] title lookup failed", titleResult.error.message);
  }

  if (artistResult.error) {
    console.warn("[search.local_entities] artist lookup failed", artistResult.error.message);
  }

  return dedupeByProviderId([
    ...((titleResult.data ?? []) as LocalEntityRow[]),
    ...((artistResult.data ?? []) as LocalEntityRow[]),
  ]).map(mapLocalEntityCandidate);
}

async function getLocalAlbumCandidates(query: string) {
  const supabase = supabasePublic();
  const pattern = toIlikePattern(query);
  const baseSelect = "id, provider, provider_id, type, title, artist_name, cover_url, deezer_url, release_date, record_type, disambiguation, first_release_date, genres";

  const [titleResult, artistResult] = await Promise.all([
    supabase
      .from("entities")
      .select(baseSelect)
      .eq("provider", "deezer")
      .eq("type", "album")
      .ilike("title", pattern)
      .limit(localSearchLimit),
    supabase
      .from("entities")
      .select(baseSelect)
      .eq("provider", "deezer")
      .eq("type", "album")
      .ilike("artist_name", pattern)
      .limit(localSearchLimit),
  ]);

  if (titleResult.error) {
    console.warn("[search.local_albums] title lookup failed", titleResult.error.message);
  }

  if (artistResult.error) {
    console.warn("[search.local_albums] artist lookup failed", artistResult.error.message);
  }

  return dedupeByProviderId([
    ...((titleResult.data ?? []) as LocalEntityRow[]),
    ...((artistResult.data ?? []) as LocalEntityRow[]),
  ]).map(mapLocalEntityCandidate);
}

async function getLocalArtistCandidates(query: string) {
  const supabase = supabasePublic();
  const pattern = toIlikePattern(query);
  const { data, error } = await supabase
    .from("artists")
    .select("id, provider, provider_id, name, image_url, deezer_url, artist_type, country_code, disambiguation, genres")
    .eq("provider", "deezer")
    .ilike("name", pattern)
    .limit(localSearchLimit);

  if (error) {
    console.warn("[search.local_artists] lookup failed", error.message);
    return [];
  }

  return ((data ?? []) as LocalArtistRow[]).map(mapLocalArtistCandidate);
}

async function getStarterTrackCandidates(query: string) {
  const supabase = supabasePublic();
  const pattern = toIlikePattern(query);
  const baseSelect = "id, provider, provider_id, type, title, artist_name, cover_url, deezer_url";

  const [titleResult, artistResult] = await Promise.all([
    supabase
      .from("starter_tracks")
      .select(baseSelect)
      .eq("provider", "deezer")
      .eq("type", "track")
      .eq("is_active", true)
      .ilike("title", pattern)
      .order("sort_order", { ascending: true })
      .limit(localSearchLimit),
    supabase
      .from("starter_tracks")
      .select(baseSelect)
      .eq("provider", "deezer")
      .eq("type", "track")
      .eq("is_active", true)
      .ilike("artist_name", pattern)
      .order("sort_order", { ascending: true })
      .limit(localSearchLimit),
  ]);

  if (titleResult.error) {
    console.warn("[search.starter_tracks] title lookup failed", titleResult.error.message);
  }

  if (artistResult.error) {
    console.warn("[search.starter_tracks] artist lookup failed", artistResult.error.message);
  }

  return dedupeByProviderId([
    ...((titleResult.data ?? []) as StarterTrackRow[]),
    ...((artistResult.data ?? []) as StarterTrackRow[]),
  ]).map(mapStarterTrackCandidate);
}

async function getEntityIdsByProviderId(providerIds: string[]) {
  const uniqueProviderIds = Array.from(new Set(providerIds));

  if (uniqueProviderIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("entities")
    .select("id, provider_id")
    .eq("provider", "deezer")
    .eq("type", "track")
    .in("provider_id", uniqueProviderIds);

  if (error) {
    console.warn("[search.entity_links] lookup failed", error.message);
    return new Map<string, string>();
  }

  return new Map(((data ?? []) as EntityLinkRow[]).map((row) => [row.provider_id, row.id]));
}

async function getDeezerCandidates(query: string) {
  const candidates: KocteauTrackSearchCandidate[] = [];
  const errors: unknown[] = [];
  const [tracksResult, artistsResult] = await Promise.allSettled([
    searchDeezerTracks(query, deezerSearchLimit),
    searchDeezerArtists(query, 3),
  ]);

  if (tracksResult.status === "fulfilled") {
    candidates.push(
      ...tracksResult.value.map((track, index) =>
        mapDeezerTrackCandidate({
          track,
          source: "deezer",
          sourceIndex: index,
        }),
      ),
    );
  } else {
    errors.push(tracksResult.reason);
  }

  if (artistsResult.status === "fulfilled") {
    const artist = artistsResult.value.find((result) =>
      isStrongArtistSearchMatch(query, result.name),
    );

    if (artist) {
      try {
        const tracks = await getDeezerArtistTopTracks(
          {
            id: artist.id,
            fan_count: artist.fan_count,
          },
          artistMatchLimit,
        );

        candidates.push(
          ...tracks.map((track, index) =>
            mapDeezerTrackCandidate({
              track,
              source: "artist-match",
              sourceIndex: index,
            }),
          ),
        );
      } catch (error) {
        errors.push(error);
      }
    }
  } else {
    errors.push(artistsResult.reason);
  }

  return {
    candidates,
    errors,
  };
}

async function getCatalogCandidates(query: string, type: "album" | "artist") {
  const localPromise =
    type === "album"
      ? getLocalAlbumCandidates(query)
      : getLocalArtistCandidates(query);
  const remotePromise =
    type === "album"
      ? searchDeezerAlbums(query, deezerSearchLimit).then((albums) =>
          albums.map(mapDeezerAlbumCandidate),
        )
      : searchDeezerArtists(query, deezerSearchLimit).then((artists) =>
          artists.map(mapDeezerArtistCandidate),
        );
  const [localCandidates, remoteResult] = await Promise.all([
    localPromise,
    Promise.allSettled([remotePromise]),
  ]);
  const remoteCandidates =
    remoteResult[0]?.status === "fulfilled" ? remoteResult[0].value : [];
  const error = remoteResult[0]?.status === "rejected" ? remoteResult[0].reason : null;
  const results = rankKocteauTrackSearchResults({
    query,
    candidates: [...localCandidates, ...remoteCandidates],
    limit: responseLimit,
  });

  if (results.length > 0) {
    return NextResponse.json(results.map(mapSearchResponse));
  }

  if (error) {
    console.error(`[search.deezer_${type}] failed with no fallback`, {
      type,
      queryLength: query.length,
      ...getDeezerErrorDetails(error),
    });

    return NextResponse.json(
      { error: "Music search is taking longer than usual. Try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json([]);
}

async function getAllCatalogCandidates(query: string) {
  const [
    localTracks,
    localAlbums,
    localArtists,
    starterTracks,
    remoteResults,
  ] = await Promise.all([
    getLocalEntityCandidates(query),
    getLocalAlbumCandidates(query),
    getLocalArtistCandidates(query),
    getStarterTrackCandidates(query),
    Promise.allSettled([
      searchDeezerTracks(query, deezerSearchLimit),
      searchDeezerAlbums(query, deezerSearchLimit),
      searchDeezerArtists(query, deezerSearchLimit),
    ]),
  ]);
  const [remoteTracksResult, remoteAlbumsResult, remoteArtistsResult] = remoteResults;
  const remoteTracks =
    remoteTracksResult?.status === "fulfilled"
      ? remoteTracksResult.value.map((track, index) =>
          mapDeezerTrackCandidate({
            track,
            source: "deezer",
            sourceIndex: index,
          }),
        )
      : [];
  const remoteAlbums =
    remoteAlbumsResult?.status === "fulfilled"
      ? remoteAlbumsResult.value.map(mapDeezerAlbumCandidate)
      : [];
  const remoteArtists =
    remoteArtistsResult?.status === "fulfilled"
      ? remoteArtistsResult.value.map(mapDeezerArtistCandidate)
      : [];
  const trackCandidates = [...localTracks, ...starterTracks, ...remoteTracks];
  const entityIdsByProviderId = await getEntityIdsByProviderId(
    trackCandidates.map((candidate) => candidate.provider_id),
  );
  const linkedTrackCandidates = trackCandidates.map((candidate) => ({
    ...candidate,
    entity_id:
      candidate.entity_id ??
      entityIdsByProviderId.get(candidate.provider_id) ??
      null,
  }));
  const artists = rankKocteauTrackSearchResults({
    query,
    candidates: [...localArtists, ...remoteArtists],
    limit: groupedArtistLimit,
  });
  const albums = rankKocteauTrackSearchResults({
    query,
    candidates: [...localAlbums, ...remoteAlbums],
    limit: groupedAlbumLimit,
  });
  const tracks = rankKocteauTrackSearchResults({
    query,
    candidates: linkedTrackCandidates,
    limit: groupedTrackLimit,
  });
  const results = [...artists, ...albums, ...tracks];
  const remoteErrors = remoteResults.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );

  if (results.length > 0) {
    if (remoteErrors.length > 0) {
      console.warn("[search.catalog] returned partial results", {
        queryLength: query.length,
        errorCount: remoteErrors.length,
      });
    }

    return NextResponse.json(results.map(mapSearchResponse));
  }

  const [firstError] = remoteErrors;

  if (firstError) {
    console.error("[search.catalog] failed with no fallback", {
      queryLength: query.length,
      ...getDeezerErrorDetails(firstError),
    });

    return NextResponse.json(
      { error: "Music search is taking longer than usual. Try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json([]);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = kocteauSearchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Search query is invalid.");
  }

  const { q, type } = parsed.data;

  if (!q) return NextResponse.json([], { status: 200 });
  if (type === "all") {
    return getAllCatalogCandidates(q);
  }
  if (type === "album" || type === "artist") {
    return getCatalogCandidates(q, type);
  }

  const [localCandidates, starterCandidates, deezerCandidatesResult] = await Promise.all([
    getLocalEntityCandidates(q),
    getStarterTrackCandidates(q),
    getDeezerCandidates(q),
  ]);

  const candidates = [
    ...localCandidates,
    ...starterCandidates,
    ...deezerCandidatesResult.candidates,
  ];
  const entityIdsByProviderId = await getEntityIdsByProviderId(
    candidates.map((candidate) => candidate.provider_id),
  );
  const linkedCandidates = candidates.map((candidate) => ({
    ...candidate,
    entity_id: candidate.entity_id ?? entityIdsByProviderId.get(candidate.provider_id) ?? null,
  }));
  const results = rankKocteauTrackSearchResults({
    query: q,
    candidates: linkedCandidates,
    limit: responseLimit,
  });
  const response = results.map(mapSearchResponse);

  if (results.length > 0) {
    if (deezerCandidatesResult.errors.length > 0) {
      console.warn("[search.deezer] returned Kocteau fallback results", {
        queryLength: q.length,
        errorCount: deezerCandidatesResult.errors.length,
      });
    }

    return NextResponse.json(response);
  }

  const [firstError] = deezerCandidatesResult.errors;

  if (firstError) {
    console.error("[search.deezer] failed with no fallback", {
      type,
      queryLength: q.length,
      ...getDeezerErrorDetails(firstError),
    });

    return NextResponse.json(
      {
        error: "Music search is taking longer than usual. Try again in a moment.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json([], { status: 200 });
}
