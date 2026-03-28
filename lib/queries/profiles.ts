import { unstable_cache } from "next/cache";
import {
  getViewerLikedReviewIds,
  runReviewListQuery,
} from "@/lib/queries/review-likes";
import { getViewerBookmarkedReviewIds } from "@/lib/queries/review-bookmarks";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { supabasePublic } from "@/lib/supabase/public";
import { supabaseServer } from "@/lib/supabase/server";

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
  created_at: string;
};

export type ProfileReviewEntity = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
};

export type ProfileReview = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  likes_count: number;
  comments_count: number;
  is_pinned?: boolean;
  created_at: string;
  entities: ProfileReviewEntity | ProfileReviewEntity[] | null;
};

export type ProfileReviewBundle = {
  pinnedReview: ProfileReview | null;
  reviews: ProfileReview[];
};

export async function getPublicProfileByUsername(username: string) {
  return unstable_cache(
    async () => {
      const supabase = supabasePublic();

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, spotify_url, apple_music_url, deezer_url, created_at")
        .eq("username", username)
        .maybeSingle<PublicProfile>();

      if (error) {
        return null;
      }

      return data;
    },
    ["public-profile", username],
    {
      revalidate: 120,
      tags: ["profiles", `profile:${username}`],
    },
  )();
}

export async function getReviewsForProfile(authorId: string): Promise<ProfileReviewBundle> {
  return unstable_cache(
    async () => {
      const supabase = supabasePublic();

      const rawReviews = await runReviewListQuery<ProfileReview>(async (mode) =>
        supabase
          .from("reviews")
          .select(
            buildReviewHydrationSelect(mode, {
              includeEntity: true,
              includePinned: true,
            }),
          )
          .eq("author_id", authorId)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false }),
      );

      const reviews = rawReviews.map((review) => ({
        ...review,
        is_pinned: Boolean(review.is_pinned),
      }));

      const pinnedReview = reviews.find((review) => review.is_pinned) ?? null;

      return {
        pinnedReview,
        reviews: reviews.filter((review) => review.id !== pinnedReview?.id),
      };
    },
    ["profile-reviews", authorId],
    {
      revalidate: 60,
      tags: ["reviews", `profile:${authorId}:reviews`],
    },
  )();
}

export async function getProfilePublicBundle(username: string) {
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    return null;
  }

  const { pinnedReview, reviews } = await getReviewsForProfile(profile.id);

  return {
    profile,
    pinnedReview,
    reviews,
  };
}

export async function getProfileViewerState(
  viewerId: string | null | undefined,
  reviewIds: string[],
) {
  if (!viewerId || reviewIds.length === 0) {
    return {
      likedReviewIds: new Set<string>(),
      bookmarkedReviewIds: new Set<string>(),
    };
  }

  const supabase = await supabaseServer();
  const [likedReviewIds, bookmarkedReviewIds] = await Promise.all([
    getViewerLikedReviewIds(supabase, viewerId, reviewIds),
    getViewerBookmarkedReviewIds(supabase, viewerId, reviewIds),
  ]);

  return {
    likedReviewIds,
    bookmarkedReviewIds,
  };
}

export async function getProfilePageBundle(
  username: string,
  viewerId?: string | null,
) {
  const publicBundle = await getProfilePublicBundle(username);

  if (!publicBundle) {
    return null;
  }

  const reviewIds = [
    ...(publicBundle.pinnedReview ? [publicBundle.pinnedReview.id] : []),
    ...publicBundle.reviews.map((review) => review.id),
  ];
  const { likedReviewIds, bookmarkedReviewIds } = await getProfileViewerState(
    viewerId,
    reviewIds,
  );

  return {
    ...publicBundle,
    likedReviewIds,
    bookmarkedReviewIds,
  };
}
