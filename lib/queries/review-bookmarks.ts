import {
  isMissingCommentsCountError,
  isMissingLikesCountError,
} from "@/lib/queries/review-likes";
import { supabaseServer } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof supabaseServer>>;
type QueryError = {
  code?: string | null;
  message?: string | null;
} | null;

type ReviewBookmarkAuthor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
} | null;

type ReviewBookmarkEntity = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
} | null;

export type SavedReview = {
  saved_at: string;
  review: {
    id: string;
    title: string | null;
    body: string | null;
    rating: number;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author: ReviewBookmarkAuthor | ReviewBookmarkAuthor[] | null;
    entities: ReviewBookmarkEntity | ReviewBookmarkEntity[] | null;
  } | null;
};

function isMissingReviewBookmarksError(error: QueryError) {
  if (!error?.message) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST200" ||
    error.code === "PGRST201" ||
    message.includes("review_bookmarks")
  );
}

function normalizeSavedReview(record: SavedReview & { created_at?: string }) {
  if (!record.review) {
    return {
      ...record,
      saved_at: record.saved_at ?? record.created_at ?? "",
    };
  }

  return {
    ...record,
    saved_at: record.saved_at ?? record.created_at ?? "",
    review: {
      ...record.review,
      likes_count:
        typeof record.review.likes_count === "number"
          ? record.review.likes_count
          : 0,
      comments_count:
        typeof record.review.comments_count === "number"
          ? record.review.comments_count
          : 0,
    },
  };
}

export async function getViewerBookmarkedReviewIds(
  supabase: ServerSupabaseClient,
  userId: string | null | undefined,
  reviewIds: string[],
) {
  if (!userId || reviewIds.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("review_bookmarks")
    .select("review_id")
    .eq("user_id", userId)
    .in("review_id", reviewIds);

  if (error && isMissingReviewBookmarksError(error)) {
    return new Set<string>();
  }

  return new Set((data ?? []).map((row) => row.review_id));
}

export async function getSavedReviewsForUser(
  supabase: ServerSupabaseClient,
  userId: string,
) {
  async function run(mode: "all" | "likes-only" | "base") {
    return supabase
      .from("review_bookmarks")
      .select([
        "created_at",
        `review:reviews!review_bookmarks_review_id_fkey (
          id,
          title,
          body,
          rating,
          ${mode !== "base" ? "likes_count," : ""}
          ${mode === "all" ? "comments_count," : ""}
          created_at,
          author:profiles!reviews_author_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          entities (
            id,
            title,
            artist_name,
            cover_url
          )
        )`,
      ].join(","))
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  }

  const withLikes = await run("all");

  if (!withLikes.error) {
    return ((withLikes.data as unknown as Array<SavedReview & { created_at?: string }> | null) ?? [])
      .map(normalizeSavedReview);
  }

  if (!isMissingReviewBookmarksError(withLikes.error)) {
    if (isMissingCommentsCountError(withLikes.error)) {
      const likesOnly = await run("likes-only");

      if (!likesOnly.error) {
        return ((likesOnly.data as unknown as Array<SavedReview & { created_at?: string }> | null) ?? [])
          .map(normalizeSavedReview);
      }

      if (!isMissingLikesCountError(likesOnly.error)) {
        return [];
      }
    } else if (!isMissingLikesCountError(withLikes.error)) {
      return [];
    }
  }

  const fallback = await run("base");

  if (fallback.error && isMissingReviewBookmarksError(fallback.error)) {
    return [];
  }

  return ((fallback.data as unknown as Array<SavedReview & { created_at?: string }> | null) ?? [])
    .map(normalizeSavedReview);
}
