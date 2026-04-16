import type { QueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
import { fetchJson } from "@/queries/http";

export type ReviewBundleEntity = ReviewCardEntity & {
  provider: "deezer";
  provider_id: string;
  type: "track";
  deezer_url: string | null;
};

export type ReviewBundleReview = ReviewCardData & {
  is_pinned?: boolean;
  entities: ReviewBundleEntity | null;
  author: ReviewCardAuthor | null;
};

export type ReviewBundleQueryData = {
  review: ReviewBundleReview;
};

export type ReviewCommentAuthor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ReviewComment = {
  id: string;
  review_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author: ReviewCommentAuthor | null;
  is_owner: boolean;
  optimistic?: boolean;
};

export const reviewKeys = {
  all: ["reviews"] as const,
  detailPrefix: () => ["reviews", "detail"] as const,
  detail: (reviewId: string) => ["reviews", "detail", reviewId] as const,
  comments: (reviewId: string) => ["reviews", "comments", reviewId] as const,
  commentsCount: (reviewId: string) => ["reviews", "comments-count", reviewId] as const,
};

export function reviewBundleQueryOptions(reviewId: string) {
  return queryOptions({
    queryKey: reviewKeys.detail(reviewId),
    queryFn: () =>
      fetchJson<ReviewBundleQueryData>(`/api/reviews/${reviewId}/bundle`),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function reviewCommentsQueryOptions(reviewId: string) {
  return queryOptions({
    queryKey: reviewKeys.comments(reviewId),
    queryFn: async () => {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.status === 503) {
        return [] as ReviewComment[];
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; comments?: ReviewComment[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "We couldn't load comments right now.");
      }

      return Array.isArray(payload?.comments) ? payload.comments : [];
    },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export function prefetchReviewBundle(queryClient: QueryClient, reviewId: string) {
  return queryClient.prefetchQuery(reviewBundleQueryOptions(reviewId));
}
