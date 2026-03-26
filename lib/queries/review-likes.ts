import { supabaseServer } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof supabaseServer>>;
type QueryError = {
  code?: string | null;
  message?: string | null;
} | null;

type QueryResult<T> = {
  data: T | null;
  error: QueryError;
};

export function isMissingLikesCountError(error: QueryError) {
  if (!error?.message) {
    return false;
  }

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message.toLowerCase().includes("likes_count")
  );
}

function withDefaultLikesCount<T extends { likes_count?: number | null }>(
  record: T,
): T & { likes_count: number } {
  return {
    ...record,
    likes_count: typeof record.likes_count === "number" ? record.likes_count : 0,
  };
}

export async function runReviewListQuery<T extends { likes_count?: number | null }>(
  run: (includeLikesCount: boolean) => Promise<QueryResult<unknown>>,
) {
  const withLikes = await run(true);

  if (!withLikes.error) {
    return ((withLikes.data as T[] | null) ?? []).map(withDefaultLikesCount);
  }

  if (!isMissingLikesCountError(withLikes.error)) {
    return [];
  }

  const fallback = await run(false);
  return ((fallback.data as T[] | null) ?? []).map(withDefaultLikesCount);
}

export async function runReviewMaybeQuery<T extends { likes_count?: number | null }>(
  run: (includeLikesCount: boolean) => Promise<QueryResult<unknown>>,
) {
  const withLikes = await run(true);

  if (!withLikes.error) {
    return withLikes.data ? withDefaultLikesCount(withLikes.data as T) : null;
  }

  if (!isMissingLikesCountError(withLikes.error)) {
    return null;
  }

  const fallback = await run(false);
  return fallback.data ? withDefaultLikesCount(fallback.data as T) : null;
}

export async function getViewerLikedReviewIds(
  supabase: ServerSupabaseClient,
  userId: string | null | undefined,
  reviewIds: string[],
) {
  if (!userId || reviewIds.length === 0) {
    return new Set<string>();
  }

  const { data } = await supabase
    .from("review_likes")
    .select("review_id")
    .eq("user_id", userId)
    .in("review_id", reviewIds);

  return new Set((data ?? []).map((row) => row.review_id));
}
