import "server-only";

import { unstable_cache } from "next/cache";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/reviews/review-card";
import type { FeedView, RecommendationReason } from "@/lib/feed-view";
import { getOrCreateLoader } from "@/lib/queries/cache-loader";
import { normalizeRelation } from "@/lib/queries/normalize-relation";
import { getViewerFollowingIds } from "@/lib/queries/profile-follows";
import { getRecentlyActiveProfiles, type ActiveProfile } from "@/lib/queries/profiles";
import {
  runReviewListQuery,
} from "@/lib/queries/review-likes";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { getViewerReviewCollectionState } from "@/lib/queries/viewer";
import { trackServerAnalyticsEvent } from "@/lib/analytics/server";
import { measureServerTask } from "@/lib/perf";
import { isPublicReviewDisplayable } from "@/lib/reviews/public-content";
import { supabasePublic } from "@/lib/supabase/public";
import { supabaseServer } from "@/lib/supabase/server";

export const FEED_PAGE_SIZE = 8;

export type FeedReview = {
  id: ReviewCardData["id"];
  title: ReviewCardData["title"];
  body: ReviewCardData["body"];
  rating: ReviewCardData["rating"];
  likes_count: ReviewCardData["likes_count"];
  comments_count: ReviewCardData["comments_count"];
  created_at: ReviewCardData["created_at"];
  entities: ReviewCardEntity | null;
  author: ReviewCardAuthor | null;
  recommendation_score?: number | null;
  recommendation_reason?: RecommendationReason | null;
};

export type FeedPageData = {
  feed: FeedReview[];
  activeUsers: ActiveProfile[];
  nextCursor: string | null;
  view: FeedView;
};

export type FeedPageBundle = FeedPageData & {
  likedReviewIds: Set<string>;
  bookmarkedReviewIds: Set<string>;
};

type FeedCursorPayload = {
  id: string;
  created_at: string;
  rating?: number;
  score?: number;
};

type FeedPageOptions = {
  view?: FeedView;
  viewerId?: string | null;
  cursor?: string | null;
  limit?: number;
  includeActiveUsers?: boolean;
  publicOnly?: boolean;
  revalidateSeconds?: number;
};

const feedPageLoaders = new Map<string, () => Promise<FeedPageData>>();

function normalizeFeedReview(review: FeedReview): FeedReview {
  return {
    ...review,
    entities: normalizeRelation(review.entities),
    author: normalizeRelation(review.author),
  };
}

function encodeFeedCursor(review: FeedReview, view: FeedView) {
  const payload: FeedCursorPayload = {
    id: review.id,
    created_at: review.created_at,
    ...(view === "top-rated" ? { rating: review.rating } : {}),
    ...(view === "for-you" && typeof review.recommendation_score === "number"
      ? { score: review.recommendation_score }
      : {}),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeFeedCursor(cursor: string | null | undefined): FeedCursorPayload | null {
  if (!cursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as
      Partial<FeedCursorPayload>;

    if (!parsed.id || !parsed.created_at) {
      return null;
    }

    return {
      id: parsed.id,
      created_at: parsed.created_at,
      rating: typeof parsed.rating === "number" ? parsed.rating : undefined,
      score: typeof parsed.score === "number" ? parsed.score : undefined,
    };
  } catch {
    return null;
  }
}

function applyFeedCursor<TQuery extends { or: (filters: string) => TQuery }>(
  query: TQuery,
  view: FeedView,
  cursor: FeedCursorPayload | null,
) {
  if (!cursor) {
    return query;
  }

  if (view === "top-rated" && typeof cursor.rating === "number") {
    return query.or(
      [
        `rating.lt.${cursor.rating}`,
        `and(rating.eq.${cursor.rating},created_at.lt.${cursor.created_at})`,
        `and(rating.eq.${cursor.rating},created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
      ].join(","),
    );
  }

  return query.or(
    [
      `created_at.lt.${cursor.created_at}`,
      `and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    ].join(","),
  );
}

async function queryFeedPage({
  view,
  cursor,
  limit,
  includeActiveUsers,
  publicOnly,
  authorIds,
}: {
  view: FeedView;
  cursor: string | null | undefined;
  limit: number;
  includeActiveUsers: boolean;
  publicOnly: boolean;
  authorIds?: string[];
}): Promise<FeedPageData> {
  if (authorIds && authorIds.length === 0) {
    const activeUsers = includeActiveUsers ? await getRecentlyActiveProfiles(4) : [];

    return {
      feed: [],
      activeUsers,
      nextCursor: null,
      view,
    };
  }

  const decodedCursor = decodeFeedCursor(cursor);
  const supabase = supabasePublic();
  const pageLimit = Math.max(1, Math.min(limit, 30));
  const [feed, activeUsers] = await Promise.all([
    runReviewListQuery<FeedReview>(async (mode) => {
      let query = supabase
        .from("reviews")
        .select(
          buildReviewHydrationSelect(mode, {
            includeAuthor: true,
            includeEntity: true,
          }),
        )
        .limit((publicOnly ? pageLimit * 2 : pageLimit) + 1);

      if (authorIds?.length) {
        query = query.in("author_id", authorIds);
      }

      query = applyFeedCursor(query, view, decodedCursor);

      if (view === "top-rated") {
        return query
          .order("rating", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });
      }

      return query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
    }),
    includeActiveUsers ? getRecentlyActiveProfiles(4) : Promise.resolve([]),
  ]);
  const normalizedFeed = feed
    .map(normalizeFeedReview)
    .filter((review) => !publicOnly || isPublicReviewDisplayable(review));
  const pageFeed = normalizedFeed.slice(0, pageLimit);
  const lastReview = pageFeed.at(-1) ?? null;

  return {
    feed: pageFeed,
    activeUsers,
    nextCursor: normalizedFeed.length > pageLimit && lastReview
      ? encodeFeedCursor(lastReview, view)
      : null,
    view,
  };
}

function normalizeRecommendationReason(value: string | null | undefined): RecommendationReason {
  return value === "entity_taste" ||
    value === "taste_match" ||
    value === "following" ||
    value === "familiar_entity" ||
    value === "author_affinity" ||
    value === "own_review" ||
    value === "popular_recent"
    ? value
    : "popular_recent";
}

type RecommendedFeedRow = FeedReview & {
  viewer_has_liked: boolean;
  viewer_has_bookmarked: boolean;
};

async function queryRecommendedFeedBundle({
  viewerId,
  cursor,
  limit,
  includeActiveUsers,
}: {
  viewerId: string | null | undefined;
  cursor: string | null | undefined;
  limit: number;
  includeActiveUsers: boolean;
}): Promise<FeedPageBundle> {
  const pageLimit = Math.max(1, Math.min(limit, 30));
  const decodedCursor = decodeFeedCursor(cursor);
  if (!viewerId) {
    return {
      feed: [],
      activeUsers: includeActiveUsers ? await getRecentlyActiveProfiles(4) : [],
      nextCursor: null, view: "for-you",
      likedReviewIds: new Set<string>(), bookmarkedReviewIds: new Set<string>(),
    };
  }

  const supabase = await supabaseServer();
  const [result, activeUsers] = await Promise.all([
    supabase.rpc("get_recommended_feed_bundle", {
      p_limit: pageLimit,
      p_cursor_score: decodedCursor?.score,
      p_cursor_created_at: decodedCursor?.created_at,
      p_cursor_id: decodedCursor?.id,
    }).returns<RecommendedFeedRow[]>(),
    includeActiveUsers ? getRecentlyActiveProfiles(4) : Promise.resolve([]),
  ]);
  if (result.error) {
    console.error("[feed.getRecommendedFeedBundle] failed", {
      code: result.error.code ?? null,
      message: result.error.message ?? null,
    });
    await trackServerAnalyticsEvent(supabase, {
      userId: viewerId, eventType: "recommendation_fallback", source: "feed:server",
      metadata: { code: result.error.code ?? null, cursor: Boolean(cursor) },
    });
    const fallback = await queryFeedPage({
      view: "latest", cursor, limit, includeActiveUsers: false, publicOnly: false,
    });
    const state = await getFeedViewerState(viewerId, fallback.feed.map((review) => review.id));
    return { ...fallback, activeUsers, view: "for-you", ...state };
  }

  const rows = (result.data ?? []).map((row) => ({
    ...normalizeFeedReview(row),
    recommendation_score: Number(row.recommendation_score ?? 0),
    recommendation_reason: normalizeRecommendationReason(row.recommendation_reason),
  }));
  const pageRows = (result.data ?? []).slice(0, pageLimit);
  const pageFeed = rows.slice(0, pageLimit);
  const lastReview = pageFeed.at(-1) ?? null;
  return {
    feed: pageFeed, activeUsers, view: "for-you",
    nextCursor: rows.length > pageLimit && lastReview
      ? encodeFeedCursor(lastReview, "for-you") : null,
    likedReviewIds: new Set(pageRows.filter((row) => row.viewer_has_liked).map((row) => row.id)),
    bookmarkedReviewIds: new Set(pageRows.filter((row) => row.viewer_has_bookmarked).map((row) => row.id)),
  };
}

export async function getFeedPage({
  view = "latest",
  viewerId = null,
  cursor = null,
  limit = FEED_PAGE_SIZE,
  includeActiveUsers = false,
  publicOnly = false,
  revalidateSeconds = 60,
}: FeedPageOptions = {}) {
  if (view === "for-you") {
    return measureServerTask(
      "getRecommendedFeedPage",
      async () => {
        const { feed, activeUsers, nextCursor, view } = await queryRecommendedFeedBundle({
          viewerId, cursor, limit, includeActiveUsers,
        });
        return { feed, activeUsers, nextCursor, view };
      },
      {
        viewerId,
        cursor: Boolean(cursor),
      },
    );
  }

  if (view === "following") {
    const followingIds = await getViewerFollowingIds(viewerId);

    return measureServerTask(
      "getFeedFollowingPage",
      async () =>
        queryFeedPage({
          view,
          cursor,
          limit,
          includeActiveUsers,
          publicOnly,
          authorIds: followingIds,
        }),
      {
        viewerId,
        cursor: Boolean(cursor),
        followingCount: followingIds.length,
      },
    );
  }

  const cacheTtlSeconds = Math.max(60, Math.min(revalidateSeconds, 60 * 60));

  return getOrCreateLoader(
    feedPageLoaders,
    [
      "feed-page",
      view,
      cursor ?? "first",
      limit,
      includeActiveUsers,
      publicOnly,
      cacheTtlSeconds,
    ],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getFeedPage",
            async () =>
              queryFeedPage({
                view,
                cursor,
                limit,
                includeActiveUsers,
                publicOnly,
              }),
            { view, cursor: Boolean(cursor), limit, includeActiveUsers, publicOnly },
          ),
        [
          "feed-page",
          view,
          cursor ?? "first",
          String(limit),
          String(includeActiveUsers),
          String(publicOnly),
          String(cacheTtlSeconds),
        ],
        {
          revalidate: cacheTtlSeconds,
          tags: ["feed", `feed:${view}`, "reviews", "entities", "profiles"],
        },
      ),
  )();
}

export async function getFeedPublicBundle(view: FeedView = "latest") {
  return getFeedPage({
    view: view === "following" || view === "for-you" ? "latest" : view,
    publicOnly: true,
  });
}

export async function getFeedViewerState(
  viewerId: string | null | undefined,
  reviewIds: string[],
) {
  if (!viewerId || reviewIds.length === 0) {
    return {
      likedReviewIds: new Set<string>(),
      bookmarkedReviewIds: new Set<string>(),
    };
  }

  return measureServerTask(
    "getFeedViewerState",
    async () => getViewerReviewCollectionState(viewerId, reviewIds),
    { viewerId, reviewCount: reviewIds.length },
  );
}

export async function getFeedPageBundle(
  viewerId?: string | null,
  view: FeedView = "latest",
  options: Pick<FeedPageOptions, "cursor" | "limit" | "includeActiveUsers"> = {},
): Promise<FeedPageBundle> {
  if (view === "for-you") {
    return measureServerTask("getRecommendedFeedPageBundle", () => queryRecommendedFeedBundle({
      viewerId, cursor: options.cursor, limit: options.limit ?? FEED_PAGE_SIZE,
      includeActiveUsers: options.includeActiveUsers ?? false,
    }), { view, cursor: Boolean(options.cursor) });
  }
  const page = await getFeedPage({ ...options, view, viewerId });

  if (!viewerId || page.feed.length === 0) {
    return {
      ...page,
      likedReviewIds: new Set<string>(),
      bookmarkedReviewIds: new Set<string>(),
    };
  }

  const { likedReviewIds, bookmarkedReviewIds } = await getFeedViewerState(
    viewerId,
    page.feed.map((review) => review.id),
  );

  return {
    ...page,
    likedReviewIds,
    bookmarkedReviewIds,
  };
}
