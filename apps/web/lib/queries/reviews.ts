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
  provider: "deezer";
  provider_id: string;
  type: "track";
  deezer_url: string | null;
};

export type ViewerReview = {
  id: string;
};

const publicReviewLoaders = new Map<string, () => Promise<ReviewPageReview | null>>();
const ownedSidebarReviewLoaders = new Map<string, () => Promise<OwnedSidebarReview[]>>();

export type OwnedSidebarReview = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  likes_count?: number | null;
  comments_count?: number | null;
  created_at: string;
  is_pinned?: boolean;
  entities: ReviewPageEntity | null;
};

function normalizeReviewPageReview(review: ReviewPageReview): ReviewPageReview {
  return {
    ...review,
    entities: normalizeRelation(review.entities),
    author: normalizeRelation(review.author),
  };
}

function logQueryFallbackError(
  scope: "getOwnedSidebarReviews" | "getViewerReview",
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

export async function getOwnedSidebarReviews(
  authorId: string,
  limit = 4,
): Promise<OwnedSidebarReview[]> {
  return getOrCreateLoader(
    ownedSidebarReviewLoaders,
    ["owned-sidebar-reviews", authorId, limit],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getOwnedSidebarReviews",
            async () => {
              const supabase = supabasePublic();
              const { data, error } = await supabase
                .from("reviews")
                .select(`
                  id,
                  title,
                  body,
                  rating,
                  is_pinned,
                  created_at,
                  entities (
                    id,
                    provider,
                    provider_id,
                    type,
                    title,
                    artist_name,
                    cover_url,
                    deezer_url
                  )
                `)
                .eq("author_id", authorId)
                .order("created_at", { ascending: false })
                .limit(limit);

              if (error) {
                logQueryFallbackError("getOwnedSidebarReviews", error, {
                  authorId,
                  limit,
                });
                return [] satisfies OwnedSidebarReview[];
              }

              return ((data as OwnedSidebarReview[] | null) ?? []).map((review) => ({
                ...review,
                is_pinned: Boolean(review.is_pinned),
                entities: normalizeRelation(review.entities),
              }));
            },
            { authorId, limit },
          ),
        ["owned-sidebar-reviews", authorId, String(limit)],
        {
          revalidate: 60,
          tags: ["reviews", `profile:${authorId}:reviews`, `owned-sidebar-reviews:${authorId}:${limit}`],
        },
      ),
  )();
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
