import { infiniteQueryOptions, queryOptions, type InfiniteData } from "@tanstack/react-query";
import type {
  StarterCandidateSource,
  StarterCandidateTrack,
} from "@/lib/starter/candidates";
import type { EditorialCandidateStatus as CandidateQueueStatus } from "@/lib/starter/candidate-queue";
import type { Tables } from "@/lib/supabase/database.types";
import { fetchJson } from "@/queries/http";

export type StarterTrackRow = Tables<"starter_tracks">;
export type StarterPreferenceTag = Tables<"preference_tags">;
export type EditorialCandidateRow = Tables<"editorial_candidates">;
export type StarterTrackTag = {
  tag_id: string;
  weight: number;
  preference_tags: StarterPreferenceTag | null;
};

export type StarterTrackWithTags = StarterTrackRow & {
  starter_track_tags?: StarterTrackTag[] | null;
};

export type StarterStudioData = {
  tracks: StarterTrackWithTags[];
  tags: StarterPreferenceTag[];
  total: number;
  limit: number;
  offset: number;
  nextOffset: number | null;
  hasMore: boolean;
};

export type StarterStudioInfiniteData = InfiniteData<StarterStudioData, number>;

export type StarterCandidateData = {
  mode: StarterCandidateSource;
  query: string;
  seed_label: string;
  tracks: StarterCandidateTrack[];
};

export type EditorialCandidateQueueData = {
  candidates: EditorialCandidateRow[];
};

export const starterKeys = {
  all: ["starter"] as const,
  curatorTracks: () => ["starter", "curator-tracks"] as const,
  curatorTracksInfinite: (limit: number) =>
    ["starter", "curator-tracks", "infinite", limit] as const,
  candidates: (mode: StarterCandidateSource, query: string, limit: number) =>
    ["starter", "candidates", mode, query, limit] as const,
  candidateQueue: (status: CandidateQueueStatus, limit: number) =>
    ["starter", "candidate-queue", status, limit] as const,
};

export function starterCuratorTracksQueryOptions({
  limit = 24,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return queryOptions({
    queryKey: [...starterKeys.curatorTracks(), limit, offset] as const,
    queryFn: () => fetchJson<StarterStudioData>(`/api/starter/tracks?${params.toString()}`),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function starterCuratorTracksInfiniteQueryOptions({
  limit = 24,
}: {
  limit?: number;
} = {}) {
  return infiniteQueryOptions({
    queryKey: starterKeys.curatorTracksInfinite(limit),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(pageParam),
      });

      return fetchJson<StarterStudioData>(`/api/starter/tracks?${params.toString()}`);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function editorialCandidateQueueQueryOptions({
  status = "queued",
  limit = 12,
}: {
  status?: CandidateQueueStatus;
  limit?: number;
}) {
  const params = new URLSearchParams({
    status,
    limit: String(limit),
  });

  return queryOptions({
    queryKey: starterKeys.candidateQueue(status, limit),
    queryFn: () =>
      fetchJson<EditorialCandidateQueueData>(
        `/api/starter/candidate-queue?${params.toString()}`,
      ),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function starterCandidatesQueryOptions({
  mode,
  query,
  limit = 8,
}: {
  mode: StarterCandidateSource;
  query: string;
  limit?: number;
}) {
  const params = new URLSearchParams({
    mode,
    q: query,
    limit: String(limit),
  });

  return queryOptions({
    queryKey: starterKeys.candidates(mode, query, limit),
    queryFn: () =>
      fetchJson<StarterCandidateData>(`/api/starter/candidates?${params.toString()}`),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
