import "server-only";

import { createPublicLookup, normalizeCatalogQuery, type LookupStatus } from "./public-lookup";
import { withSearchDeadline } from "./deadline";
import { attachEntityIds } from "./entity-links";
import type { SearchScope, SearchSource } from "@/lib/search-types";
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
  rankCatalogSearchResults,
  type KocteauTrackSearchCandidate,
} from "@/lib/search/kocteau-first";
import { supabasePublic } from "@/lib/supabase/public";

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

class LocalLookupFailure extends Error {
  constructor(readonly candidates: KocteauTrackSearchCandidate[]) {
    super("Public catalog lookup failed");
  }
}

const localSearchLimit = 18;
const deezerSearchLimit = 18;
const artistMatchLimit = 12;

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
    rank: result.rank ?? null,
    source_index: result.source_index,
  };
}

async function getLocalEntityCandidates(query: string, type: "track" | "album", signal: AbortSignal) {
  const supabase = supabasePublic();
  const pattern = toIlikePattern(query);
  const baseSelect = "id, provider, provider_id, type, title, artist_name, cover_url, deezer_url, release_date, record_type, disambiguation, first_release_date, genres";

  const [titleResult, artistResult] = await Promise.all([
    supabase
      .from("entities")
      .select(baseSelect)
      .eq("provider", "deezer")
      .eq("type", type)
      .ilike("title", pattern)
      .limit(localSearchLimit)
      .abortSignal(signal),
    supabase
      .from("entities")
      .select(baseSelect)
      .eq("provider", "deezer")
      .eq("type", type)
      .ilike("artist_name", pattern)
      .limit(localSearchLimit)
      .abortSignal(signal),
  ]);

  if (titleResult.error) {
    console.warn("[search.local_entities] title lookup failed", titleResult.error.message);
  }

  if (artistResult.error) {
    console.warn("[search.local_entities] artist lookup failed", artistResult.error.message);
  }

  const candidates = dedupeByProviderId([
    ...((titleResult.data ?? []) as LocalEntityRow[]),
    ...((artistResult.data ?? []) as LocalEntityRow[]),
  ]).map(mapLocalEntityCandidate);
  if (titleResult.error || artistResult.error) throw new LocalLookupFailure(candidates);
  return candidates;
}

async function getLocalArtistCandidates(query: string, signal: AbortSignal) {
  const supabase = supabasePublic();
  const pattern = toIlikePattern(query);
  const { data, error } = await supabase
    .from("artists")
    .select("id, provider, provider_id, name, image_url, deezer_url, artist_type, country_code, disambiguation, genres")
    .eq("provider", "deezer")
    .ilike("name", pattern)
    .limit(localSearchLimit)
    .abortSignal(signal);

  if (error) {
    console.warn("[search.local_artists] lookup failed", error.message);
    throw new LocalLookupFailure([]);
  }

  return ((data ?? []) as LocalArtistRow[]).map(mapLocalArtistCandidate);
}

async function getStarterTrackCandidates(query: string, signal: AbortSignal) {
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
      .limit(localSearchLimit)
      .abortSignal(signal),
    supabase
      .from("starter_tracks")
      .select(baseSelect)
      .eq("provider", "deezer")
      .eq("type", "track")
      .eq("is_active", true)
      .ilike("artist_name", pattern)
      .order("sort_order", { ascending: true })
      .limit(localSearchLimit)
      .abortSignal(signal),
  ]);

  if (titleResult.error) {
    console.warn("[search.starter_tracks] title lookup failed", titleResult.error.message);
  }

  if (artistResult.error) {
    console.warn("[search.starter_tracks] artist lookup failed", artistResult.error.message);
  }

  const candidates = dedupeByProviderId([
    ...((titleResult.data ?? []) as StarterTrackRow[]),
    ...((artistResult.data ?? []) as StarterTrackRow[]),
  ]).map(mapStarterTrackCandidate);
  if (titleResult.error || artistResult.error) throw new LocalLookupFailure(candidates);
  return candidates;
}

async function getEntityIdsByProviderId(providerIds: string[], signal: AbortSignal) {
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
    .in("provider_id", uniqueProviderIds)
    .abortSignal(signal);

  if (error) {
    console.warn("[search.entity_links] lookup failed", error.message);
    throw new Error("Public catalog entity links unavailable");
  }

  return new Map(((data ?? []) as EntityLinkRow[]).map((row) => [row.provider_id, row.id]));
}

const getCachedEntityLinks = createPublicLookup(
  async (signal, providerIds: string[]) =>
    Array.from((await getEntityIdsByProviderId(providerIds, signal)).entries()),
  ["public-catalog-entity-links-v2"],
  { tags: ["entities"], timeoutMs: 750 },
);

export async function attachSearchEntityIds<T extends { provider_id: string; entity_id?: string | null }>(
  candidates: readonly T[],
) {
  let status: LookupStatus = "skipped";
  const linked = await attachEntityIds(candidates, async (providerIds) => {
    try {
      const lookup = await getCachedEntityLinks(providerIds);
      status = lookup.status;
      return new Map(lookup.value);
    } catch (error) {
      status = "degraded";
      throw error;
    }
  });
  return { candidates: linked, status };
}

async function getDeezerCandidates(query: string, signal: AbortSignal) {
  const candidates: KocteauTrackSearchCandidate[] = [];
  const errors: unknown[] = [];
  const [tracksResult, artistsResult] = await Promise.allSettled([
    searchDeezerTracks(query, deezerSearchLimit, { signal }),
    searchDeezerArtists(query, 3, { signal }),
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

    if (artist && !signal.aborted) {
      try {
        const tracks = await getDeezerArtistTopTracks(
          {
            id: artist.id,
            fan_count: artist.fan_count,
          },
          artistMatchLimit,
          { signal, throwOnError: true },
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


async function loadLocalCandidates(query: string, type: SearchScope, signal: AbortSignal) {
  const results = await Promise.allSettled([
    type === "all" || type === "track" ? getLocalEntityCandidates(query, "track", signal) : [],
    type === "all" || type === "album" ? getLocalEntityCandidates(query, "album", signal) : [],
    type === "all" || type === "artist" ? getLocalArtistCandidates(query, signal) : [],
    type === "all" || type === "track" ? getStarterTrackCandidates(query, signal) : [],
  ]);

  const candidates = results.flatMap((result) =>
    result.status === "fulfilled"
      ? result.value
      : result.reason instanceof LocalLookupFailure ? result.reason.candidates : [],
  );
  // Return partial data to this request without caching a transient DB failure.
  if (results.some((result) => result.status === "rejected")) {
    throw new LocalLookupFailure(candidates);
  }
  return candidates;
}

// Only anonymous, public catalog data enters this cache. Arguments form part of
// the key. Review mutations invalidate entities; the TTL bounds artist/starter staleness.
const getLocalCandidates = createPublicLookup(
  (signal, query: string, type: SearchScope) => loadLocalCandidates(query, type, signal),
  ["public-catalog-search-v2"],
  { tags: ["entities", "artists", "starter-tracks"] },
);

async function getRemoteCandidates(query: string, type: SearchScope, signal: AbortSignal) {
  if (type === "track") return getDeezerCandidates(query, signal);

  const results = await Promise.allSettled([
    type === "all"
      ? searchDeezerTracks(query, deezerSearchLimit, { signal }).then((tracks) =>
          tracks.map((track, index) =>
            mapDeezerTrackCandidate({ track, source: "deezer", sourceIndex: index }),
          ),
        )
      : Promise.resolve([]),
    type === "all" || type === "album"
      ? searchDeezerAlbums(query, deezerSearchLimit, { signal }).then((albums) =>
          albums.map(mapDeezerAlbumCandidate),
        )
      : Promise.resolve([]),
    type === "all" || type === "artist"
      ? searchDeezerArtists(query, deezerSearchLimit, { signal }).then((artists) =>
          artists.map(mapDeezerArtistCandidate),
        )
      : Promise.resolve([]),
  ]);

  return {
    candidates: results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    ),
    errors: results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    ),
  };
}

export async function searchCatalog(
  query: string,
  type: SearchScope,
  source: SearchSource,
  { signal }: { signal?: AbortSignal } = {},
) {
  const timings = { local: 0, catalog: 0, links: 0, rank: 0 };
  async function measure<T>(stage: keyof typeof timings, run: () => Promise<T>) {
    const start = performance.now();
    try {
      return await run();
    } finally {
      timings[stage] = performance.now() - start;
    }
  }
  const [local, remote] = await Promise.all([
    source === "remote"
      ? { candidates: [] as KocteauTrackSearchCandidate[], status: "skipped" as LookupStatus }
      : measure("local", async () => {
          try {
            const lookup = await getLocalCandidates(normalizeCatalogQuery(query), type);
            return { candidates: lookup.value, status: lookup.status };
          } catch (error) {
            console.warn("[search.local] lookup unavailable");
            return {
              candidates: error instanceof LocalLookupFailure ? error.candidates : [],
              status: "degraded" as LookupStatus,
            };
          }
        }),
    source === "local"
      ? { candidates: [], errors: [] }
      : measure("catalog", () => withSearchDeadline(
          (remoteSignal) => getRemoteCandidates(query, type, remoteSignal),
          { signal },
        )),
  ]);
  signal?.throwIfAborted();
  const unlinkedCandidates = [...local.candidates, ...remote.candidates];
  const linkedTracks = await measure("links", () => attachSearchEntityIds(
    unlinkedCandidates.filter((candidate) => candidate.type === "track"),
  ));
  signal?.throwIfAborted();
  const candidates = [
    ...unlinkedCandidates.filter((candidate) => candidate.type !== "track"),
    ...linkedTracks.candidates,
  ];
  const rankStartedAt = performance.now();
  const results = (source === "all" ? rankCatalogSearchResults({
    query,
    type,
    candidates,
  }) : rankKocteauTrackSearchResults({
    query,
    candidates,
    // Preserve candidates across phases before applying the final type quotas.
    limit: candidates.length,
  })).map(mapSearchResponse);

  timings.rank = performance.now() - rankStartedAt;

  if (remote.errors.length) {
    console.warn("[search.catalog] provider failures", {
      queryLength: query.length,
      type,
      errorCount: remote.errors.length,
      ...getDeezerErrorDetails(remote.errors[0]),
    });
  }

  return {
    results,
    hasProviderError: remote.errors.length > 0,
    readiness: {
      local: local.status,
      links: linkedTracks.status,
      provider: source === "local" ? "skipped" as const
        : remote.errors.length ? "degraded" as const : "fresh" as const,
    },
    timings,
  };
}
