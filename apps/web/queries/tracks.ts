import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { DiscoveryTrack } from "@/lib/types/discovery";
import type { SearchEntityType, SearchScope } from "@/lib/search-types";
import { fetchJson, isRetryableFetchJsonError } from "@/queries/http";

export type DeezerSearchResult = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  artist_provider_id?: string | null;
  artist_picture_url?: string | null;
  album_provider_id?: string | null;
  album_title?: string | null;
  album_deezer_url?: string | null;
  album_record_type?: string | null;
  release_date?: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
};

export type KocteauSearchResult = Omit<DeezerSearchResult, "type"> & {
  type: "track" | "album" | "artist";
  artist_type?: string | null;
  country_code?: string | null;
  disambiguation?: string | null;
  first_release_date?: string | null;
  genres?: string[];
  source?: "local" | "starter" | "artist-match" | "deezer";
  source_label?: string;
  score?: number;
};

export const trackKeys = {
  all: ["tracks"] as const,
  recent: (limit: number) => ["tracks", "recent", limit] as const,
  search: (type: SearchEntityType, query: string) =>
    ["tracks", "search", type, query] as const,
  kocteauSearch: (type: SearchScope, query: string) =>
    ["tracks", "kocteau-search", type, query] as const,
};

export function recentTracksQueryOptions(limit = 12) {
  return queryOptions({
    queryKey: trackKeys.recent(limit),
    queryFn: () =>
      fetchJson<DiscoveryTrack[]>(`/api/tracks/recent?limit=${limit}`),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function deezerTrackSearchQueryOptions(
  query: string,
  type: SearchEntityType = "track",
) {
  const params = new URLSearchParams({
    q: query,
    type,
  });

  return queryOptions({
    queryKey: trackKeys.search(type, query),
    queryFn: async ({ signal }) => {
      const payload = await fetchJson<DeezerSearchResult[]>(
        `/api/deezer/search?${params.toString()}`,
        { signal },
      );

      return Array.isArray(payload) ? payload : [];
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) =>
      failureCount < 1 && isRetryableFetchJsonError(error),
  });
}

export function kocteauTrackSearchQueryOptions(
  query: string,
  type: SearchScope = "track",
) {
  const params = new URLSearchParams({
    q: query,
    type,
  });

  return queryOptions({
    queryKey: trackKeys.kocteauSearch(type, query),
    queryFn: async ({ signal }) => {
      const payload = await fetchJson<KocteauSearchResult[]>(
        `/api/search?${params.toString()}`,
        { signal },
      );

      return Array.isArray(payload) ? payload : [];
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) =>
      failureCount < 1 && isRetryableFetchJsonError(error),
  });
}
