import type { QueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
import type { ActiveProfile } from "@/lib/queries/profiles";
import { fetchJson } from "@/queries/http";

export type FeedBundleReview = ReviewCardData & {
  entities: ReviewCardEntity | ReviewCardEntity[] | null;
  author: ReviewCardAuthor | ReviewCardAuthor[] | null;
};

export type FeedBundleQueryData = {
  feed: FeedBundleReview[];
  activeUsers: ActiveProfile[];
};

export const feedKeys = {
  all: ["feed"] as const,
  bundle: () => ["feed", "bundle"] as const,
};

export function feedBundleQueryOptions() {
  return queryOptions({
    queryKey: feedKeys.bundle(),
    queryFn: () => fetchJson<FeedBundleQueryData>("/api/feed"),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function prefetchFeedBundle(queryClient: QueryClient) {
  return queryClient.prefetchQuery(feedBundleQueryOptions());
}
