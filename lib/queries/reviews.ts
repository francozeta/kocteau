import "server-only";

import { unstable_cache } from "next/cache";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
import {
  runReviewMaybeQuery,
} from "@/lib/queries/review-likes";
import { getOrCreateLoader } from "@/lib/queries/cache-loader";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { getViewerReviewCollectionState } from "@/lib/queries/viewer";
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
  entities: ReviewPageEntity | ReviewPageEntity[] | null;
  author: ReviewCardAuthor | ReviewCardAuthor[] | null;
};

export type ReviewPageEntity = ReviewCardEntity & {
  provider: "deezer";
  provider_id: string;
  type: "track";
  deezer_url: string | null;
};

export type ViewerReview = {
  id: string;
};

const publicReviewLoaders = new Map<string, () => Promise<ReviewPageReview | null>>();

export async function getPublicReviewById(reviewId: string) {
  return getOrCreateLoader(
    publicReviewLoaders,
    ["review", reviewId],
    () =>
      unstable_cache(
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
      ),
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

  const { likedReviewIds, bookmarkedReviewIds } = await measureServerTask(
    "getReviewViewerState",
    async () => getViewerReviewCollectionState(viewerId, [reviewId]),
    { viewerId, reviewId },
  );

  return {
    liked: likedReviewIds.has(reviewId),
    bookmarked: bookmarkedReviewIds.has(reviewId),
  };
}

export async function getReviewPageBundle(
  reviewId: string,
  viewerId?: string | null,
) {
  const [review, viewerState] = await Promise.all([
    getPublicReviewById(reviewId),
    getReviewViewerState(viewerId, reviewId),
  ]);

  if (!review) {
    return null;
  }

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
