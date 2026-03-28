import "server-only";

import { unstable_cache } from "next/cache";
import type {
  ReviewCardAuthor,
  ReviewCardData,
  ReviewCardEntity,
} from "@/components/review-card";
import { getViewerBookmarkedReviewIds } from "@/lib/queries/review-bookmarks";
import { getRecentlyDiscussedTracks, type DiscoveryTrack } from "@/lib/queries/discovery";
import {
  getViewerLikedReviewIds,
  runReviewListQuery,
} from "@/lib/queries/review-likes";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { measureServerTask } from "@/lib/perf";
import { supabasePublic } from "@/lib/supabase/public";
import { supabaseServer } from "@/lib/supabase/server";

export type FeedReview = {
  id: ReviewCardData["id"];
  title: ReviewCardData["title"];
  body: ReviewCardData["body"];
  rating: ReviewCardData["rating"];
  likes_count: ReviewCardData["likes_count"];
  comments_count: ReviewCardData["comments_count"];
  created_at: ReviewCardData["created_at"];
  entities: ReviewCardEntity | ReviewCardEntity[] | null;
  author: ReviewCardAuthor | ReviewCardAuthor[] | null;
};

export type FeedPageBundle = {
  feed: FeedReview[];
  recentTracks: DiscoveryTrack[];
  likedReviewIds: Set<string>;
  bookmarkedReviewIds: Set<string>;
};

export const getFeedPublicBundle = unstable_cache(
  async () =>
    measureServerTask("getFeedPublicBundle", async () => {
      const supabase = supabasePublic();

      const [feed, recentTracks] = await Promise.all([
        runReviewListQuery<FeedReview>(async (mode) =>
          supabase
            .from("reviews")
            .select(
              buildReviewHydrationSelect(mode, {
                includeAuthor: true,
                includeEntity: true,
              }),
            )
            .order("created_at", { ascending: false })
            .limit(24),
        ),
        getRecentlyDiscussedTracks(4),
      ]);

      return {
        feed,
        recentTracks,
      };
    }),
  ["feed-page-public-bundle"],
  {
    revalidate: 60,
    tags: ["feed", "reviews", "entities"],
  },
);

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

  const { likedReviewIds, bookmarkedReviewIds } = await measureServerTask(
    "getFeedViewerState",
    async () => {
      const supabase = await supabaseServer();
      const [likedReviewIds, bookmarkedReviewIds] = await Promise.all([
        getViewerLikedReviewIds(supabase, viewerId, reviewIds),
        getViewerBookmarkedReviewIds(supabase, viewerId, reviewIds),
      ]);

      return {
        likedReviewIds,
        bookmarkedReviewIds,
      };
    },
    { viewerId, reviewCount: reviewIds.length },
  );

  return {
    likedReviewIds,
    bookmarkedReviewIds,
  };
}

export async function getFeedPageBundle(viewerId?: string | null): Promise<FeedPageBundle> {
  const { feed, recentTracks } = await getFeedPublicBundle();

  if (!viewerId || feed.length === 0) {
    return {
      feed,
      recentTracks,
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
    recentTracks,
    likedReviewIds,
    bookmarkedReviewIds,
  };
}
