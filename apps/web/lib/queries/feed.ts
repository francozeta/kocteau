import "server-only";

import { unstable_cache } from "next/cache";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
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
import { measureServerTask } from "@/lib/perf";
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
  authorIds,
}: {
  view: FeedView;
  cursor: string | null | undefined;
  limit: number;
  includeActiveUsers: boolean;
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
        .limit(pageLimit + 1);

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
  const normalizedFeed = feed.map(normalizeFeedReview);
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

type RecommendedReviewRow = {
  review_id: string;
  score: number | string | null;
  reason: string | null;
  created_at: string;
};

function normalizeRecommendationReason(value: string | null | undefined): RecommendationReason {
  return value === "entity_taste" ||
    value === "taste_match" ||
    value === "following" ||
    value === "familiar_entity" ||
    value === "author_affinity" ||
    value === "popular_recent"
    ? value
    : "popular_recent";
}

async function queryRecommendedFeedPage({
  viewerId,
  cursor,
  limit,
  includeActiveUsers,
}: {
  viewerId: string | null | undefined;
  cursor: string | null | undefined;
  limit: number;
  includeActiveUsers: boolean;
}): Promise<FeedPageData> {
  const pageLimit = Math.max(1, Math.min(limit, 30));
  const decodedCursor = decodeFeedCursor(cursor);

  if (!viewerId) {
    const activeUsers = includeActiveUsers ? await getRecentlyActiveProfiles(4) : [];

    return {
      feed: [],
      activeUsers,
      nextCursor: null,
      view: "for-you",
    };
  }

  const supabase = await supabaseServer();
  const [recommendationsResult, activeUsers] = await Promise.all([
    supabase.rpc("get_recommended_review_ids", {
      p_limit: pageLimit + 1,
      p_cursor_score: decodedCursor?.score ?? null,
      p_cursor_created_at: decodedCursor?.created_at ?? null,
      p_cursor_id: decodedCursor?.id ?? null,
    }),
    includeActiveUsers ? getRecentlyActiveProfiles(4) : Promise.resolve([]),
  ]);

  if (recommendationsResult.error) {
    console.error("[feed.getRecommendedFeedPage] failed", {
      code: recommendationsResult.error.code ?? null,
      message: recommendationsResult.error.message ?? null,
    });

    const fallbackPage = await queryFeedPage({
      view: "latest",
      cursor,
      limit,
      includeActiveUsers,
    });

    return {
      ...fallbackPage,
      view: "for-you",
    };
  }

  const recommendationRows =
    ((recommendationsResult.data ?? []) as RecommendedReviewRow[])
      .filter((row) => row.review_id)
      .map((row) => ({
        ...row,
        score: Number(row.score ?? 0),
        reason: normalizeRecommendationReason(row.reason),
      }));
  const reviewIds = recommendationRows.map((row) => row.review_id);

  if (reviewIds.length === 0) {
    return {
      feed: [],
      activeUsers,
      nextCursor: null,
      view: "for-you",
    };
  }

  const recommendationByReviewId = new Map(
    recommendationRows.map((row) => [row.review_id, row]),
  );
  const feed = await runReviewListQuery<FeedReview>(async (mode) =>
    supabase
      .from("reviews")
      .select(
        buildReviewHydrationSelect(mode, {
          includeAuthor: true,
          includeEntity: true,
        }),
      )
      .in("id", reviewIds),
  );
  const feedById = new Map(
    feed.map((review) => [review.id, normalizeFeedReview(review)]),
  );
  const orderedFeed = recommendationRows.flatMap((row) => {
    const review = feedById.get(row.review_id);

    if (!review) {
      return [];
    }

    const recommendation = recommendationByReviewId.get(row.review_id);

    return [
      {
        ...review,
        recommendation_score: recommendation?.score ?? null,
        recommendation_reason: recommendation?.reason ?? "popular_recent",
      },
    ];
  });
  const pageFeed = orderedFeed.slice(0, pageLimit);
  const lastReview = pageFeed.at(-1) ?? null;

  return {
    feed: pageFeed,
    activeUsers,
    nextCursor: orderedFeed.length > pageLimit && lastReview
      ? encodeFeedCursor(lastReview, "for-you")
      : null,
    view: "for-you",
  };
}

export async function getFeedPage({
  view = "latest",
  viewerId = null,
  cursor = null,
  limit = FEED_PAGE_SIZE,
  includeActiveUsers = false,
}: FeedPageOptions = {}) {
  if (view === "for-you") {
    return measureServerTask(
      "getRecommendedFeedPage",
      async () =>
        queryRecommendedFeedPage({
          viewerId,
          cursor,
          limit,
          includeActiveUsers,
        }),
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
          authorIds: followingIds,
        }),
      {
        viewerId,
        cursor: Boolean(cursor),
        followingCount: followingIds.length,
      },
    );
  }

  return getOrCreateLoader(
    feedPageLoaders,
    ["feed-page", view, cursor ?? "first", limit, includeActiveUsers],
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
              }),
            { view, cursor: Boolean(cursor), limit, includeActiveUsers },
          ),
        ["feed-page", view, cursor ?? "first", String(limit), String(includeActiveUsers)],
        {
          revalidate: 60,
          tags: ["feed", `feed:${view}`, "reviews", "entities", "profiles"],
        },
      ),
  )();
}

export async function getFeedPublicBundle(view: FeedView = "latest") {
  return getFeedPage({
    view: view === "following" || view === "for-you" ? "latest" : view,
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
): Promise<FeedPageBundle> {
  const page = await getFeedPage({ view, viewerId });

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
