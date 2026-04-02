import { unstable_cache } from "next/cache";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { getOrCreateLoader } from "@/lib/queries/cache-loader";
import { runReviewListQuery } from "@/lib/queries/review-likes";
import { getViewerReviewCollectionState } from "@/lib/queries/viewer";
import { measureServerTask } from "@/lib/perf";
import { supabasePublic } from "@/lib/supabase/public";

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

export type ActiveProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  latest_review_at: string;
  latest_track_title: string | null;
  latest_track_artist_name: string | null;
  review_count: number;
};

type ActiveProfileAuthor = Pick<
  PublicProfile,
  "id" | "username" | "display_name" | "avatar_url"
>;

type ActiveProfileEntity = {
  title: string;
  artist_name: string | null;
};

type ActiveProfileRow = {
  created_at: string;
  author_id: string;
  author: ActiveProfileAuthor | ActiveProfileAuthor[] | null;
  entities: ActiveProfileEntity | ActiveProfileEntity[] | null;
};

const publicProfileLoaders = new Map<string, () => Promise<PublicProfile | null>>();
const profileReviewLoaders = new Map<string, () => Promise<ProfileReviewBundle>>();
const activeProfileLoaders = new Map<string, () => Promise<ActiveProfile[]>>();

function getActiveProfileAuthor(row: ActiveProfileRow) {
  if (Array.isArray(row.author)) {
    return row.author[0] ?? null;
  }

  return row.author;
}

function getActiveProfileEntity(row: ActiveProfileRow) {
  if (Array.isArray(row.entities)) {
    return row.entities[0] ?? null;
  }

  return row.entities;
}

export async function getPublicProfileByUsername(username: string) {
  return getOrCreateLoader(
    publicProfileLoaders,
    ["public-profile", username],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getPublicProfileByUsername",
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
            { username },
          ),
        ["public-profile", username],
        {
          revalidate: 120,
          tags: ["profiles", `profile:${username}`],
        },
      ),
  )();
}

export async function getReviewsForProfile(authorId: string): Promise<ProfileReviewBundle> {
  return getOrCreateLoader(
    profileReviewLoaders,
    ["profile-reviews", authorId],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getReviewsForProfile",
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
            { authorId },
          ),
        ["profile-reviews", authorId],
        {
          revalidate: 60,
          tags: ["reviews", `profile:${authorId}:reviews`],
        },
      ),
  )();
}

export async function getRecentlyActiveProfiles(limit = 6): Promise<ActiveProfile[]> {
  return getOrCreateLoader(
    activeProfileLoaders,
    ["recently-active-profiles", limit],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getRecentlyActiveProfiles",
            async () => {
              const supabase = supabasePublic();

              const { data } = await supabase
                .from("reviews")
                .select(`
                  created_at,
                  author_id,
                  author:profiles!reviews_author_id_fkey (
                    id,
                    username,
                    display_name,
                    avatar_url
                  ),
                  entities (
                    title,
                    artist_name
                  )
                `)
                .order("created_at", { ascending: false })
                .limit(Math.max(limit * 6, 36));

              const seen = new Set<string>();
              const activeProfiles: ActiveProfile[] = [];
              const authorIds: string[] = [];

              for (const row of (data ?? []) as ActiveProfileRow[]) {
                if (seen.has(row.author_id)) {
                  continue;
                }

                const author = getActiveProfileAuthor(row);

                if (!author?.username) {
                  continue;
                }

                seen.add(row.author_id);
                authorIds.push(row.author_id);

                const entity = getActiveProfileEntity(row);

                activeProfiles.push({
                  id: author.id,
                  username: author.username,
                  display_name: author.display_name,
                  avatar_url: author.avatar_url,
                  latest_review_at: row.created_at,
                  latest_track_title: entity?.title ?? null,
                  latest_track_artist_name: entity?.artist_name ?? null,
                  review_count: 1,
                });

                if (activeProfiles.length >= limit) {
                  break;
                }
              }

              if (authorIds.length === 0) {
                return activeProfiles;
              }

              const { data: reviewCounts } = await supabase
                .from("reviews")
                .select("author_id")
                .in("author_id", authorIds);

              const countMap = new Map<string, number>();

              for (const row of reviewCounts ?? []) {
                const nextCount = (countMap.get(row.author_id) ?? 0) + 1;
                countMap.set(row.author_id, nextCount);
              }

              return activeProfiles.map((profile) => ({
                ...profile,
                review_count: Math.max(countMap.get(profile.id) ?? 1, 1),
              }));
            },
            { limit },
          ),
        ["recently-active-profiles", String(limit)],
        {
          revalidate: 60,
          tags: ["profiles", "reviews", `recently-active-profiles:${limit}`],
        },
      ),
  )();
}

export async function getProfilePublicBundle(username: string) {
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    return null;
  }

  const { pinnedReview, reviews } = await measureServerTask(
    "getProfilePublicBundle",
    async () => getReviewsForProfile(profile.id),
    { username, profileId: profile.id },
  );

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

  return measureServerTask(
    "getProfileViewerState",
    async () => getViewerReviewCollectionState(viewerId, reviewIds),
    { viewerId, reviewCount: reviewIds.length },
  );
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
