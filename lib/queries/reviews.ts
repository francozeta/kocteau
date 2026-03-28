import "server-only";

import { unstable_cache } from "next/cache";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
import { getViewerBookmarkedReviewIds } from "@/lib/queries/review-bookmarks";
import {
  getViewerLikedReviewIds,
  runReviewMaybeQuery,
} from "@/lib/queries/review-likes";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { measureServerTask } from "@/lib/perf";
import { supabasePublic } from "@/lib/supabase/public";
import { supabaseServer } from "@/lib/supabase/server";

export type ReviewPageReview = {
  id: ReviewCardData["id"];
  title: ReviewCardData["title"];
  body: ReviewCardData["body"];
  rating: ReviewCardData["rating"];
  likes_count: ReviewCardData["likes_count"];
  comments_count: ReviewCardData["comments_count"];
  created_at: ReviewCardData["created_at"];
  is_pinned?: boolean;
  entities: ReviewCardEntity | ReviewCardEntity[] | null;
  author: ReviewCardAuthor | ReviewCardAuthor[] | null;
};

export type ViewerReview = {
  id: string;
};

export async function getPublicReviewById(reviewId: string) {
  return unstable_cache(
    async () =>
      measureServerTask(
        "getPublicReviewById",
        async () => {
          const supabase = supabasePublic();

          return runReviewMaybeQuery<ReviewPageReview>(async (mode) =>
            supabase
              .from("reviews")
              .select(
                buildReviewHydrationSelect(mode, {
                  includeAuthor: true,
                  includeEntity: true,
                  includePinned: true,
                }),
              )
              .eq("id", reviewId)
              .maybeSingle(),
          );
        },
        { reviewId },
      ),
    ["review", reviewId],
    {
      revalidate: 60,
      tags: ["reviews", `review:${reviewId}`],
    },
  )();
}

export async function getReviewViewerState(
  viewerId: string | null | undefined,
  reviewId: string,
) {
  if (!viewerId) {
    return {
      liked: false,
      bookmarked: false,
    };
  }

  const { liked, bookmarked } = await measureServerTask(
    "getReviewViewerState",
    async () => {
      const supabase = await supabaseServer();
      const [likedReviewIds, bookmarkedReviewIds] = await Promise.all([
        getViewerLikedReviewIds(supabase, viewerId, [reviewId]),
        getViewerBookmarkedReviewIds(supabase, viewerId, [reviewId]),
      ]);

      return {
        liked: likedReviewIds.has(reviewId),
        bookmarked: bookmarkedReviewIds.has(reviewId),
      };
    },
    { viewerId, reviewId },
  );

  return {
    liked,
    bookmarked,
  };
}

export async function getReviewPageBundle(
  reviewId: string,
  viewerId?: string | null,
) {
  const review = await getPublicReviewById(reviewId);

  if (!review) {
    return null;
  }

  const viewerState = await getReviewViewerState(viewerId, reviewId);

  return {
    review,
    ...viewerState,
  };
}

export async function getViewerReview(
  entityId: string,
  viewerId: string | null | undefined,
) {
  if (!viewerId) {
    return null;
  }

  return measureServerTask(
    "getViewerReview",
    async () => {
      const supabase = await supabaseServer();
      const { data, error } = await supabase
        .from("reviews")
        .select("id")
        .eq("entity_id", entityId)
        .eq("author_id", viewerId)
        .maybeSingle<ViewerReview>();

      if (error) {
        return null;
      }

      return data;
    },
    { entityId, viewerId },
  );
}
