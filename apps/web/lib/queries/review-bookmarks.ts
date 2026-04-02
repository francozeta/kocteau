import {
  runReviewListQuery,
} from "@/lib/queries/review-likes";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { supabaseServer } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof supabaseServer>>;
type QueryError = {
  code?: string | null;
  message?: string | null;
} | null;

type ReviewBookmarkAuthor = {
  id: string;
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

export type SavedReviewBookmark = {
  review_id: string;
  saved_at: string;
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

function normalizeSavedReviewBookmark(
  record: { review_id: string; created_at?: string | null },
): SavedReviewBookmark {
  return {
    review_id: record.review_id,
    saved_at: record.created_at ?? "",
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

export async function getSavedReviewBookmarksForUser(
  supabase: ServerSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("review_bookmarks")
    .select("review_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error && isMissingReviewBookmarksError(error)) {
    return [] satisfies SavedReviewBookmark[];
  }

  if (error) {
    return [] satisfies SavedReviewBookmark[];
  }

  return ((data as Array<{ review_id: string; created_at?: string | null }> | null) ?? [])
    .map(normalizeSavedReviewBookmark);
}

export async function getSavedReviewMapById(
  supabase: ServerSupabaseClient,
  reviewIds: string[],
) {
  if (reviewIds.length === 0) {
    return new Map<string, SavedReview["review"]>();
  }

  const reviews = await runReviewListQuery<NonNullable<SavedReview["review"]>>(
    async (mode) =>
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

  return new Map(
    reviews.map((review) => [review.id, normalizeSavedReview({ saved_at: "", review }).review]),
  );
}

export async function getSavedReviewsForUser(
  supabase: ServerSupabaseClient,
  userId: string,
) {
  const bookmarks = await getSavedReviewBookmarksForUser(supabase, userId);

  if (bookmarks.length === 0) {
    return [] satisfies SavedReview[];
  }

  const reviewMap = await getSavedReviewMapById(
    supabase,
    bookmarks.map((bookmark) => bookmark.review_id),
  );

  return bookmarks.map((bookmark) => ({
    saved_at: bookmark.saved_at,
    review: reviewMap.get(bookmark.review_id) ?? null,
  }));
}
