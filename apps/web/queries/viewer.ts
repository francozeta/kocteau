import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type {
  ReviewCardData,
} from "@/components/review-card";
import type { FeedBundleQueryData, FeedInfiniteQueryData } from "@/queries/feed";
import { feedKeys } from "@/queries/feed";
import type { ReviewBundleQueryData } from "@/queries/reviews";
import { reviewKeys } from "@/queries/reviews";
import type { TrackBundleQueryData } from "@/queries/tracks";
import { trackKeys } from "@/queries/tracks";
import { fetchJson } from "@/queries/http";

export type ReviewLikeState = {
  liked: boolean;
  count: number;
};

export type ReviewBookmarkState = {
  bookmarked: boolean;
};

export type ReviewContentPatch = Pick<
  ReviewCardData,
  "title" | "body" | "rating"
> & {
  is_pinned?: boolean;
};

type ReviewCacheSnapshotEntry<TData> = [QueryKey, TData | undefined];

export type ReviewCacheSnapshot = {
  feedBundles: ReviewCacheSnapshotEntry<FeedBundleQueryData>[];
  feedInfinite: ReviewCacheSnapshotEntry<FeedInfiniteQueryData>[];
  trackDetails: ReviewCacheSnapshotEntry<TrackBundleQueryData>[];
  reviewDetails: ReviewCacheSnapshotEntry<ReviewBundleQueryData>[];
  savedReviews: ViewerSavedReview[] | undefined;
};

type ViewerSavedReviewAuthor = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
} | null;

type ViewerSavedReviewEntity = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
} | null;

export type ViewerSavedReview = {
  saved_at: string;
  review: (ReviewCardData & {
    author: ViewerSavedReviewAuthor;
    entities: ViewerSavedReviewEntity;
  }) | null;
};

export const viewerKeys = {
  all: ["viewer"] as const,
  reviewLike: (reviewId: string) => ["viewer", "reviews", reviewId, "like"] as const,
  reviewBookmark: (reviewId: string) =>
    ["viewer", "reviews", reviewId, "bookmark"] as const,
  savedReviews: () => ["viewer", "saved-reviews"] as const,
};

export function viewerSavedReviewsQueryOptions() {
  return queryOptions({
    queryKey: viewerKeys.savedReviews(),
    queryFn: async () => {
      const payload = await fetchJson<{ reviews?: ViewerSavedReview[] }>(
        "/api/viewer/saved-reviews",
      );

      return Array.isArray(payload.reviews) ? payload.reviews : [];
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

function patchReviewRecord<
  T extends {
    id: string;
    likes_count?: number;
    comments_count?: number;
    viewer_has_liked?: boolean;
    viewer_has_bookmarked?: boolean;
  },
>(
  review: T,
  reviewId: string,
  patch: Partial<T>,
) {
  if (review.id !== reviewId) {
    return review;
  }

  return {
    ...review,
    ...patch,
  };
}

function patchSavedReviewCollection(
  current: ViewerSavedReview[] | undefined,
  reviewId: string,
  patch: Partial<NonNullable<ViewerSavedReview["review"]>>,
) {
  if (!current) {
    return current;
  }

  return current.map((item) => {
    if (!item.review || item.review.id !== reviewId) {
      return item;
    }

    return {
      ...item,
      review: {
        ...item.review,
        ...patch,
      },
    };
  });
}

function removeSavedReviewFromCollection(
  current: ViewerSavedReview[] | undefined,
  reviewId: string,
) {
  if (!current) {
    return current;
  }

  return current.filter((item) => item.review?.id !== reviewId);
}

function patchFeedCollections(
  queryClient: QueryClient,
  reviewId: string,
  patch: Partial<FeedBundleQueryData["feed"][number]>,
) {
  queryClient.setQueriesData<FeedBundleQueryData>(
    { queryKey: feedKeys.bundlePrefix() },
    (current) =>
      current
        ? {
            ...current,
            feed: current.feed.map((review) => patchReviewRecord(review, reviewId, patch)),
          }
        : current,
  );

  queryClient.setQueriesData<FeedInfiniteQueryData>(
    { queryKey: feedKeys.infinitePrefix() },
    (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              feed: page.feed.map((review) => patchReviewRecord(review, reviewId, patch)),
            })),
          }
        : current,
  );
}

function patchTrackCollections(
  queryClient: QueryClient,
  reviewId: string,
  patch: Partial<TrackBundleQueryData["reviews"][number]>,
) {
  queryClient.setQueriesData<TrackBundleQueryData>(
    { queryKey: trackKeys.detailPrefix() },
    (current) =>
      current
        ? {
            ...current,
            reviews: current.reviews.map((review) => patchReviewRecord(review, reviewId, patch)),
          }
        : current,
  );
}

function patchReviewDetail(
  queryClient: QueryClient,
  reviewId: string,
  patch: Partial<ReviewBundleQueryData["review"]>,
) {
  queryClient.setQueriesData<ReviewBundleQueryData>(
    { queryKey: reviewKeys.detailPrefix() },
    (current) =>
      current && current.review.id === reviewId
        ? {
            ...current,
            review: {
              ...current.review,
              ...patch,
            },
          }
        : current,
  );
}

export function getReviewCacheSnapshot(
  queryClient: QueryClient,
): ReviewCacheSnapshot {
  return {
    feedBundles: queryClient.getQueriesData<FeedBundleQueryData>({
      queryKey: feedKeys.bundlePrefix(),
    }),
    feedInfinite: queryClient.getQueriesData<FeedInfiniteQueryData>({
      queryKey: feedKeys.infinitePrefix(),
    }),
    trackDetails: queryClient.getQueriesData<TrackBundleQueryData>({
      queryKey: trackKeys.detailPrefix(),
    }),
    reviewDetails: queryClient.getQueriesData<ReviewBundleQueryData>({
      queryKey: reviewKeys.detailPrefix(),
    }),
    savedReviews: queryClient.getQueryData<ViewerSavedReview[]>(
      viewerKeys.savedReviews(),
    ),
  };
}

export function restoreReviewCacheSnapshot(
  queryClient: QueryClient,
  snapshot: ReviewCacheSnapshot,
) {
  snapshot.feedBundles.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
  snapshot.feedInfinite.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
  snapshot.trackDetails.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
  snapshot.reviewDetails.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
  queryClient.setQueryData(viewerKeys.savedReviews(), snapshot.savedReviews);
}

export function syncReviewContent(
  queryClient: QueryClient,
  reviewId: string,
  patch: ReviewContentPatch,
) {
  patchFeedCollections(queryClient, reviewId, patch);
  patchTrackCollections(queryClient, reviewId, patch);
  patchReviewDetail(queryClient, reviewId, patch);
  queryClient.setQueryData<ViewerSavedReview[] | undefined>(
    viewerKeys.savedReviews(),
    (current) => patchSavedReviewCollection(current, reviewId, patch),
  );
}

export function removeReviewFromCollections(
  queryClient: QueryClient,
  reviewId: string,
) {
  queryClient.setQueriesData<FeedBundleQueryData>(
    { queryKey: feedKeys.bundlePrefix() },
    (current) =>
      current
        ? {
            ...current,
            feed: current.feed.filter((review) => review.id !== reviewId),
          }
        : current,
  );

  queryClient.setQueriesData<FeedInfiniteQueryData>(
    { queryKey: feedKeys.infinitePrefix() },
    (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              feed: page.feed.filter((review) => review.id !== reviewId),
            })),
          }
        : current,
  );

  queryClient.setQueriesData<TrackBundleQueryData>(
    { queryKey: trackKeys.detailPrefix() },
    (current) =>
      current
        ? {
            ...current,
            reviews: current.reviews.filter((review) => review.id !== reviewId),
            viewerReviewId:
              current.viewerReviewId === reviewId ? null : current.viewerReviewId,
          }
        : current,
  );

  queryClient.removeQueries({
    queryKey: reviewKeys.detail(reviewId),
    exact: true,
  });

  queryClient.setQueryData<ViewerSavedReview[] | undefined>(
    viewerKeys.savedReviews(),
    (current) => removeSavedReviewFromCollection(current, reviewId),
  );
}

export function syncReviewLikeState(
  queryClient: QueryClient,
  reviewId: string,
  nextState: ReviewLikeState,
) {
  queryClient.setQueryData(viewerKeys.reviewLike(reviewId), nextState);
  patchFeedCollections(queryClient, reviewId, {
    viewer_has_liked: nextState.liked,
    likes_count: nextState.count,
  });
  patchTrackCollections(queryClient, reviewId, {
    viewer_has_liked: nextState.liked,
    likes_count: nextState.count,
  });
  patchReviewDetail(queryClient, reviewId, {
    viewer_has_liked: nextState.liked,
    likes_count: nextState.count,
  });
  queryClient.setQueryData<ViewerSavedReview[] | undefined>(
    viewerKeys.savedReviews(),
    (current) =>
      patchSavedReviewCollection(current, reviewId, {
        viewer_has_liked: nextState.liked,
        likes_count: nextState.count,
      }),
  );
}

export function syncReviewBookmarkState(
  queryClient: QueryClient,
  reviewId: string,
  nextState: ReviewBookmarkState,
) {
  queryClient.setQueryData(viewerKeys.reviewBookmark(reviewId), nextState);
  patchFeedCollections(queryClient, reviewId, {
    viewer_has_bookmarked: nextState.bookmarked,
  });
  patchTrackCollections(queryClient, reviewId, {
    viewer_has_bookmarked: nextState.bookmarked,
  });
  patchReviewDetail(queryClient, reviewId, {
    viewer_has_bookmarked: nextState.bookmarked,
  });

  queryClient.setQueryData<ViewerSavedReview[] | undefined>(
    viewerKeys.savedReviews(),
    (current) => {
      if (!current) {
        return current;
      }

      if (!nextState.bookmarked) {
        return current.filter((item) => item.review?.id !== reviewId);
      }

      return patchSavedReviewCollection(current, reviewId, {
        viewer_has_bookmarked: true,
      });
    },
  );
}

export function syncReviewCommentsCount(
  queryClient: QueryClient,
  reviewId: string,
  nextCount: number,
) {
  queryClient.setQueryData(reviewKeys.commentsCount(reviewId), nextCount);
  patchFeedCollections(queryClient, reviewId, {
    comments_count: nextCount,
  });
  patchTrackCollections(queryClient, reviewId, {
    comments_count: nextCount,
  });
  patchReviewDetail(queryClient, reviewId, {
    comments_count: nextCount,
  });
  queryClient.setQueryData<ViewerSavedReview[] | undefined>(
    viewerKeys.savedReviews(),
    (current) =>
      patchSavedReviewCollection(current, reviewId, {
        comments_count: nextCount,
      }),
  );
}
