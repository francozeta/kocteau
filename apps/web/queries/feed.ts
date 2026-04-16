import type { QueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
import type { ActiveProfile } from "@/lib/queries/profiles";
import { fetchJson } from "@/queries/http";

export type FeedView = "latest" | "top-rated";

export type FeedBundleReview = ReviewCardData & {
  entities: ReviewCardEntity | null;
  author: ReviewCardAuthor | null;
};

export type FeedBundleQueryData = {
  feed: FeedBundleReview[];
  activeUsers: ActiveProfile[];
};

export const feedKeys = {
  all: ["feed"] as const,
  bundlePrefix: () => ["feed", "bundle"] as const,
  bundle: (view: FeedView = "latest") => ["feed", "bundle", view] as const,
};

export function feedBundleQueryOptions(view: FeedView = "latest") {
  return queryOptions({
    queryKey: feedKeys.bundle(view),
    queryFn: () => fetchJson<FeedBundleQueryData>(`/api/feed?view=${view}`),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function prefetchFeedBundle(queryClient: QueryClient, view: FeedView = "latest") {
  return queryClient.prefetchQuery(feedBundleQueryOptions(view));
}
