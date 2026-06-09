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
import { normalizeRelation } from "@/lib/queries/normalize-relation";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { getViewerReviewCollectionState } from "@/lib/queries/viewer";
import { measureServerTask } from "@/lib/perf";
import { isFullUuid, isShortUuidPrefix } from "@/lib/seo-routes";
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
  entities: ReviewPageEntity | null;
  author: ReviewCardAuthor | null;
};

export type ReviewPageEntity = ReviewCardEntity & {
  provider: string;
  provider_id: string;
  type: "track" | "album";
  deezer_url: string | null;
};

export type ViewerReview = {
  id: string;
};

const publicReviewLoaders = new Map<string, () => Promise<ReviewPageReview | null>>();
const publicReviewByRouteIdLoaders = new Map<string, () => Promise<ReviewPageReview | null>>();

function normalizeReviewPageReview(review: ReviewPageReview): ReviewPageReview {
  return {
    ...review,
    entities: normalizeRelation(review.entities),
    author: normalizeRelation(review.author),
  };
}

function logQueryFallbackError(
  scope: "getViewerReview",
  error: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  },
  context: Record<string, unknown>,
) {
  console.error(`[reviews.${scope}] failed`, {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    context,
  });
}

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

              const review = await runReviewMaybeQuery<ReviewPageReview>(async (mode) =>
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

              return review ? normalizeReviewPageReview(review) : null;
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

export async function getPublicReviewByRouteId(routeId: string) {
  if (isFullUuid(routeId)) {
    return getPublicReviewById(routeId);
  }

  if (!isShortUuidPrefix(routeId)) {
    return null;
  }

  const normalizedRouteId = routeId.toLowerCase();

  return getOrCreateLoader(
    publicReviewByRouteIdLoaders,
    ["review-route-id", normalizedRouteId],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getPublicReviewByRouteId",
            async () => {
              const supabase = supabasePublic();
              const review = await runReviewMaybeQuery<ReviewPageReview>(async (mode) =>
                supabase
                  .from("reviews")
                  .select(
                    buildReviewHydrationSelect(mode, {
                      includeAuthor: true,
                      includeEntity: true,
                      includePinned: true,
                    }),
                  )
                  .eq("short_id", normalizedRouteId)
                  .maybeSingle(),
              );

              return review ? normalizeReviewPageReview(review) : null;
            },
            { routeId: normalizedRouteId },
          ),
        ["review-route-id", normalizedRouteId],
        {
          revalidate: 60,
          tags: ["reviews", `review-route:${normalizedRouteId}`],
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
        logQueryFallbackError("getViewerReview", error, {
          entityId,
          viewerId,
        });
        return null;
      }

      return data;
    },
    { entityId, viewerId },
  );
}
