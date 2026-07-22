import type { QueryClient } from "@tanstack/react-query";
import { infiniteQueryOptions, queryOptions, type InfiniteData } from "@tanstack/react-query";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
import type { FeedView, RecommendationReason } from "@/lib/feed-view";
import type { ActiveProfile } from "@/lib/queries/profiles";
import { fetchJson, isRetryableFetchJsonError } from "@/queries/http";

export type { FeedView } from "@/lib/feed-view";

export type FeedBundleReview = ReviewCardData & {
  entities: ReviewCardEntity | null;
  author: ReviewCardAuthor | null;
  recommendation_score?: number | null;
  recommendation_reason?: RecommendationReason | null;
};

export type FeedBundleQueryData = {
  feed: FeedBundleReview[];
  activeUsers: ActiveProfile[];
  nextCursor: string | null;
  view: FeedView;
  requiresAuth?: boolean;
};

export type FeedInfiniteQueryData = InfiniteData<FeedBundleQueryData, string | null>;

function getFeedUrl(view: FeedView, cursor?: string | null) {
  const params = new URLSearchParams();

  if (view !== "for-you") {
    params.set("view", view);
  }

  if (cursor) {
    params.set("cursor", cursor);
  }

  const queryString = params.toString();

  return queryString ? `/api/feed?${queryString}` : "/api/feed";
}

export const feedKeys = {
  all: ["feed"] as const,
  bundlePrefix: () => ["feed", "bundle"] as const,
  bundle: (view: FeedView = "latest") => ["feed", "bundle", view] as const,
  infinitePrefix: () => ["feed", "infinite"] as const,
  infinite: (view: FeedView = "latest") => ["feed", "infinite", view] as const,
};

const feedCacheTimeMs = 30 * 60_000;

function getFeedStaleTime(view: FeedView) {
  return view === "latest" || view === "top-rated"
    ? 5 * 60_000
    : 2 * 60_000;
}

function shouldRetryFeedRequest(failureCount: number, error: unknown) {
  return failureCount < 1 && isRetryableFetchJsonError(error);
}

export function feedBundleQueryOptions(view: FeedView = "latest") {
  return queryOptions({
    queryKey: feedKeys.bundle(view),
    queryFn: () => fetchJson<FeedBundleQueryData>(getFeedUrl(view)),
    staleTime: getFeedStaleTime(view),
    gcTime: feedCacheTimeMs,
    retry: shouldRetryFeedRequest,
    refetchOnReconnect: false,
  });
}

export function feedInfiniteQueryOptions(view: FeedView = "latest") {
  return infiniteQueryOptions({
    queryKey: feedKeys.infinite(view),
    queryFn: ({ pageParam }) =>
      fetchJson<FeedBundleQueryData>(getFeedUrl(view, pageParam)),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: getFeedStaleTime(view),
    gcTime: feedCacheTimeMs,
    retry: shouldRetryFeedRequest,
    refetchOnReconnect: false,
  });
}

export function prefetchFeedBundle(queryClient: QueryClient, view: FeedView = "latest") {
  return queryClient.prefetchQuery(feedBundleQueryOptions(view));
}
