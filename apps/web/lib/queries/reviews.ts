import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/reviews/review-card";
import {
  runReviewListQuery,
  runReviewMaybeQuery,
} from "@/lib/queries/review-likes";
import { getOrCreateLoader } from "@/lib/queries/cache-loader";
import { canonicalRouteTag } from "@/lib/queries/canonical-cache";
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
const publicReviewRouteLoaders = new Map<string, () => Promise<ReviewPageReview | null>>();


function normalizeReviewPageReview(review: ReviewPageReview): ReviewPageReview {
  return {
    ...review,
    entities: normalizeRelation(review.entities),
    author: normalizeRelation(review.author),
  };
}

function logQueryFallbackError(
  scope: "getViewerReview" | "getPublicReviewById",
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

export async function getPublicReviewById(
  rawId: string,
  { throwOnError = false }: { throwOnError?: boolean } = {},
) {
  const reviewId = rawId.toLowerCase();
  const loader = getOrCreateLoader(
    publicReviewLoaders,
    ["review", reviewId],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getPublicReviewById",
            async () => {
              const supabase = supabasePublic();

              const review = await runReviewMaybeQuery<ReviewPageReview>(
                async (mode) =>
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
                { throwOnError: true },
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
  );

  try {
    return await loader();
  } catch (error) {
    logQueryFallbackError(
      "getPublicReviewById",
      error as { code?: string; message?: string; details?: string; hint?: string },
      { reviewId },
    );
    if (throwOnError) throw error;
    return null;
  }
}

export const getPublicReviewByRouteId = cache(
  async function getPublicReviewByRouteId(routeId: string) {
    if (isFullUuid(routeId)) {
      return getPublicReviewById(routeId.toLowerCase(), { throwOnError: true });
    }
    if (!isShortUuidPrefix(routeId)) return null;

    const normalizedRouteId = routeId.toLowerCase();
    const loader = getOrCreateLoader(
      publicReviewRouteLoaders,
      ["review-route-v1", normalizedRouteId],
      () =>
        unstable_cache(
          () =>
            measureServerTask(
              "getPublicReviewByRouteId",
              async () => {
                const supabase = supabasePublic();
                const reviews = await runReviewListQuery<ReviewPageReview>(
                  async (mode) => {
                    let query = supabase
                      .from("reviews")
                      .select(
                        buildReviewHydrationSelect(mode, {
                          includeAuthor: true,
                          includeEntity: true,
                          includePinned: true,
                        }),
                      )
                      .limit(2);
                    query =
                      normalizedRouteId.length === 8
                        ? query.like("short_id", `${normalizedRouteId}%`)
                        : query.eq("short_id", normalizedRouteId);
                    return query.returns<ReviewPageReview[]>();
                  },
                  { throwOnError: true },
                );
                if (reviews.length !== 1) {
                  if (reviews.length > 1)
                    console.warn(
                      "[reviews.getPublicReviewByRouteId] ambiguous route id",
                      { routeId: normalizedRouteId },
                    );
                  return null;
                }
                return normalizeReviewPageReview(reviews[0]);
              },
              { routeId: normalizedRouteId },
            ),
          ["review-route-v1", normalizedRouteId],
          {
            revalidate: 60,
            tags: ["reviews", canonicalRouteTag("review", normalizedRouteId)],
          },
        ),
    );
    return loader();
  },
);

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
