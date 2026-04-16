import type { QueryClient } from "@tanstack/react-query";
import { infiniteQueryOptions, queryOptions, type InfiniteData } from "@tanstack/react-query";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
import type { FeedView } from "@/lib/feed-view";
import type { ActiveProfile } from "@/lib/queries/profiles";
import { fetchJson } from "@/queries/http";

export type { FeedView } from "@/lib/feed-view";

export type FeedBundleReview = ReviewCardData & {
  entities: ReviewCardEntity | null;
  author: ReviewCardAuthor | null;
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
  const params = new URLSearchParams({ view });

  if (cursor) {
    params.set("cursor", cursor);
  }

  return `/api/feed?${params.toString()}`;
}

export const feedKeys = {
  all: ["feed"] as const,
  bundlePrefix: () => ["feed", "bundle"] as const,
  bundle: (view: FeedView = "latest") => ["feed", "bundle", view] as const,
  infinitePrefix: () => ["feed", "infinite"] as const,
  infinite: (view: FeedView = "latest") => ["feed", "infinite", view] as const,
};

export function feedBundleQueryOptions(view: FeedView = "latest") {
  return queryOptions({
    queryKey: feedKeys.bundle(view),
    queryFn: () => fetchJson<FeedBundleQueryData>(getFeedUrl(view)),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function feedInfiniteQueryOptions(view: FeedView = "latest") {
  return infiniteQueryOptions({
    queryKey: feedKeys.infinite(view),
    queryFn: ({ pageParam }) =>
      fetchJson<FeedBundleQueryData>(getFeedUrl(view, pageParam)),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function prefetchFeedBundle(queryClient: QueryClient, view: FeedView = "latest") {
  return queryClient.prefetchQuery(feedBundleQueryOptions(view));
}
