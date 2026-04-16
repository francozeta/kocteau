import "server-only";

import type { ReviewCardData } from "@/components/review-card";
import { measureServerTask } from "@/lib/perf";
import {
  getSavedReviewBookmarksForUser,
  getSavedReviewMapById,
  getViewerBookmarkedReviewIds,
} from "@/lib/queries/review-bookmarks";
import { getViewerLikedReviewIds } from "@/lib/queries/review-likes";
import { supabaseServer } from "@/lib/supabase/server";

export type ReviewCollectionViewerState = {
  likedReviewIds: Set<string>;
  bookmarkedReviewIds: Set<string>;
};

export type SerializedReviewCollectionViewerState = {
  likedReviewIds: string[];
  bookmarkedReviewIds: string[];
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

export type ViewerSavedReviewsBundle = {
  reviews: ViewerSavedReview[];
};

function normalizeReviewIds(reviewIds: string[]) {
  return [...new Set(reviewIds.filter(Boolean))].sort();
}

async function loadViewerReviewState(
  viewerId: string | null | undefined,
  reviewIds: string[],
) {
  if (!viewerId || reviewIds.length === 0) {
    return {
      likedReviewIds: new Set<string>(),
      bookmarkedReviewIds: new Set<string>(),
    } satisfies ReviewCollectionViewerState;
  }

  const supabase = await supabaseServer();
  const [likedReviewIds, bookmarkedReviewIds] = await Promise.all([
    getViewerLikedReviewIds(supabase, viewerId, reviewIds),
    getViewerBookmarkedReviewIds(supabase, viewerId, reviewIds),
  ]);

  return {
    likedReviewIds,
    bookmarkedReviewIds,
  } satisfies ReviewCollectionViewerState;
}

export async function getViewerReviewCollectionState(
  viewerId: string | null | undefined,
  reviewIds: string[],
) {
  return loadViewerReviewState(viewerId, normalizeReviewIds(reviewIds));
}

export function serializeReviewCollectionViewerState(
  viewerState: ReviewCollectionViewerState,
): SerializedReviewCollectionViewerState {
  return {
    likedReviewIds: [...viewerState.likedReviewIds],
    bookmarkedReviewIds: [...viewerState.bookmarkedReviewIds],
  };
}

export async function getViewerSavedReviewsBundle(
  userId: string,
): Promise<ViewerSavedReviewsBundle> {
  return measureServerTask(
    "getViewerSavedReviewsBundle",
    async () => {
      const supabase = await supabaseServer();
      const bookmarks = await getSavedReviewBookmarksForUser(supabase, userId);
      const reviewIds = bookmarks.map((bookmark) => bookmark.review_id);
      const [reviewMap, likedReviewIds] = await Promise.all([
        getSavedReviewMapById(supabase, reviewIds),
        getViewerLikedReviewIds(supabase, userId, reviewIds),
      ]);

      return {
        reviews: bookmarks.map((bookmark) => {
          const review = reviewMap.get(bookmark.review_id) ?? null;

          if (!review) {
            return {
              saved_at: bookmark.saved_at,
              review: null,
            } satisfies ViewerSavedReview;
          }

          return {
            saved_at: bookmark.saved_at,
            review: {
              ...review,
              viewer_has_liked: likedReviewIds.has(review.id),
              viewer_has_bookmarked: true,
            },
          } satisfies ViewerSavedReview;
        }),
      } satisfies ViewerSavedReviewsBundle;
    },
    { userId },
  );
}
