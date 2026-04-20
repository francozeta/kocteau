import type { QueryClient } from "@tanstack/react-query";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { ReviewCardAuthor, ReviewCardData } from "@/components/review-card";
import type { DiscoveryTrack } from "@/lib/types/discovery";
import type { SearchEntityType } from "@/lib/search-types";
import { fetchJson } from "@/queries/http";

export type TrackEntity = {
  id: string;
  provider: string;
  provider_id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  type: "track" | "album";
};

export type TrackBundleReview = ReviewCardData & {
  is_pinned?: boolean;
  author: ReviewCardAuthor | null;
};

export type TrackTasteTag = {
  id: string;
  kind: "genre" | "mood" | "scene" | "style" | "era" | "format";
  slug: string;
  label: string;
  source: string;
  weight: number;
};

export type TrackBundleQueryData = {
  entity: TrackEntity;
  tags: TrackTasteTag[];
  reviews: TrackBundleReview[];
  viewerReviewId: string | null;
};

export type DeezerSearchResult = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
};

export const trackKeys = {
  all: ["tracks"] as const,
  detailPrefix: () => ["tracks", "detail"] as const,
  recent: (limit: number) => ["tracks", "recent", limit] as const,
  detail: (trackId: string) => ["tracks", "detail", trackId] as const,
  search: (type: SearchEntityType, query: string) =>
    ["tracks", "search", type, query] as const,
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

export function trackBundleQueryOptions(trackId: string) {
  return queryOptions({
    queryKey: trackKeys.detail(trackId),
    queryFn: () =>
      fetchJson<TrackBundleQueryData>(`/api/tracks/${trackId}/bundle`),
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
    queryFn: async () => {
      const payload = await fetchJson<DeezerSearchResult[]>(
        `/api/deezer/search?${params.toString()}`,
      );

      return Array.isArray(payload) ? payload : [];
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function prefetchTrackBundle(queryClient: QueryClient, trackId: string) {
  return queryClient.prefetchQuery(trackBundleQueryOptions(trackId));
}
