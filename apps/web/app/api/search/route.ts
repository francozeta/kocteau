import { NextResponse } from "next/server";
import {
  DeezerRequestError,
  getDeezerArtistTopTracks,
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
import { deezerSearchQuerySchema } from "@/lib/validation/schemas";
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

function toIlikePattern(query: string) {
  return `%${query.replace(/[\\%_]/g, "\\$&")}%`;
}

function dedupeByProviderId<T extends { provider_id: string }>(rows: T[]) {
  const byProviderId = new Map<string, T>();

  for (const row of rows) {
    if (!byProviderId.has(row.provider_id)) {
      byProviderId.set(row.provider_id, row);
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
    type: "track",
    title: row.title,
    artist_name: row.artist_name,
    cover_url: row.cover_url,
    deezer_url: row.deezer_url,
    entity_id: row.id,
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
    cover_url: track.cover_url,
    deezer_url: track.deezer_url,
    source,
    source_index: sourceIndex,
    rank: track.rank ?? null,
  };
}

function mapSearchResponse(result: ReturnType<typeof rankKocteauTrackSearchResults>[number]) {
  return {
    provider: result.provider,
    provider_id: result.provider_id,
    type: result.type,
    title: result.title,
    artist_name: result.artist_name,
    cover_url: result.cover_url,
    deezer_url: result.deezer_url,
    entity_id: result.entity_id ?? null,
    source: result.source,
    source_label: result.source_label,
  };
}

async function getLocalEntityCandidates(query: string) {
  const supabase = supabasePublic();
  const pattern = toIlikePattern(query);
  const baseSelect = "id, provider, provider_id, type, title, artist_name, cover_url, deezer_url";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = deezerSearchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Search query is invalid.");
  }

  const { q, type } = parsed.data;

  if (!q) return NextResponse.json([], { status: 200 });
  if (type !== "track") {
    return NextResponse.json(
      { error: `Search for ${type} is not available yet.` },
      { status: 501 },
    );
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
      status: firstError instanceof DeezerRequestError ? firstError.status : null,
      message: firstError instanceof Error ? firstError.message : "Unknown Deezer search error",
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
