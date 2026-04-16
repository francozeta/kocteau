import "server-only";

import { unstable_cache } from "next/cache";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
import type { FeedView } from "@/lib/feed-view";
import { getOrCreateLoader } from "@/lib/queries/cache-loader";
import { normalizeRelation } from "@/lib/queries/normalize-relation";
import { getRecentlyActiveProfiles, type ActiveProfile } from "@/lib/queries/profiles";
import {
  runReviewListQuery,
} from "@/lib/queries/review-likes";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { getViewerReviewCollectionState } from "@/lib/queries/viewer";
import { measureServerTask } from "@/lib/perf";
import { supabasePublic } from "@/lib/supabase/public";

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
};

export type FeedPageBundle = {
  feed: FeedReview[];
  activeUsers: ActiveProfile[];
  likedReviewIds: Set<string>;
  bookmarkedReviewIds: Set<string>;
};

const feedBundleLoaders = new Map<string, () => Promise<{
  feed: FeedReview[];
  activeUsers: ActiveProfile[];
}>>();

function normalizeFeedReview(review: FeedReview): FeedReview {
  return {
    ...review,
    entities: normalizeRelation(review.entities),
    author: normalizeRelation(review.author),
  };
}

export async function getFeedPublicBundle(view: FeedView = "latest") {
  return getOrCreateLoader(
    feedBundleLoaders,
    ["feed-page-public-bundle", view],
    () =>
      unstable_cache(
        async () =>
          measureServerTask("getFeedPublicBundle", async () => {
            const supabase = supabasePublic();

            const [feed, activeUsers] = await Promise.all([
              runReviewListQuery<FeedReview>(async (mode) => {
                const query = supabase
                  .from("reviews")
                  .select(
                    buildReviewHydrationSelect(mode, {
                      includeAuthor: true,
                      includeEntity: true,
                    }),
                  )
                  .limit(24);

                if (view === "top-rated") {
                  return query
                    .order("rating", { ascending: false })
                    .order("created_at", { ascending: false });
                }

                return query.order("created_at", { ascending: false });
              }),
              getRecentlyActiveProfiles(4),
            ]);

            return {
              feed: feed.map(normalizeFeedReview),
              activeUsers,
            };
          }, { view }),
        ["feed-page-public-bundle", view],
        {
          revalidate: 60,
          tags: ["feed", `feed:${view}`, "reviews", "entities", "profiles"],
        },
      ),
  )();
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

export async function getFeedPageBundle(viewerId?: string | null): Promise<FeedPageBundle> {
  const { feed, activeUsers } = await getFeedPublicBundle();

  if (!viewerId || feed.length === 0) {
    return {
      feed,
      activeUsers,
      likedReviewIds: new Set<string>(),
      bookmarkedReviewIds: new Set<string>(),
    };
  }

  const { likedReviewIds, bookmarkedReviewIds } = await getFeedViewerState(
    viewerId,
    feed.map((review) => review.id),
  );

  return {
    feed,
    activeUsers,
    likedReviewIds,
    bookmarkedReviewIds,
  };
}
