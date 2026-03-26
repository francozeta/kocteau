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

type ReviewMetricsMode = "all" | "likes-only" | "base";

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

export function isMissingCommentsCountError(error: QueryError) {
  if (!error?.message) {
    return false;
  }

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message.toLowerCase().includes("comments_count")
  );
}

function withDefaultReviewMetrics<
  T extends { likes_count?: number | null; comments_count?: number | null },
>(
  record: T,
): T & { likes_count: number; comments_count: number } {
  return {
    ...record,
    likes_count: typeof record.likes_count === "number" ? record.likes_count : 0,
    comments_count:
      typeof record.comments_count === "number" ? record.comments_count : 0,
  };
}

export async function runReviewListQuery<
  T extends { likes_count?: number | null; comments_count?: number | null },
>(
  run: (mode: ReviewMetricsMode) => Promise<QueryResult<unknown>>,
) {
  const withAllMetrics = await run("all");

  if (!withAllMetrics.error) {
    return ((withAllMetrics.data as T[] | null) ?? []).map(withDefaultReviewMetrics);
  }

  if (isMissingCommentsCountError(withAllMetrics.error)) {
    const withLikesOnly = await run("likes-only");

    if (!withLikesOnly.error) {
      return ((withLikesOnly.data as T[] | null) ?? []).map(withDefaultReviewMetrics);
    }

    if (!isMissingLikesCountError(withLikesOnly.error)) {
      return [];
    }
  } else if (!isMissingLikesCountError(withAllMetrics.error)) {
    return [];
  }

  const fallback = await run("base");
  return ((fallback.data as T[] | null) ?? []).map(withDefaultReviewMetrics);
}

export async function runReviewMaybeQuery<
  T extends { likes_count?: number | null; comments_count?: number | null },
>(
  run: (mode: ReviewMetricsMode) => Promise<QueryResult<unknown>>,
) {
  const withAllMetrics = await run("all");

  if (!withAllMetrics.error) {
    return withAllMetrics.data
      ? withDefaultReviewMetrics(withAllMetrics.data as T)
      : null;
  }

  if (isMissingCommentsCountError(withAllMetrics.error)) {
    const withLikesOnly = await run("likes-only");

    if (!withLikesOnly.error) {
      return withLikesOnly.data
        ? withDefaultReviewMetrics(withLikesOnly.data as T)
        : null;
    }

    if (!isMissingLikesCountError(withLikesOnly.error)) {
      return null;
    }
  } else if (!isMissingLikesCountError(withAllMetrics.error)) {
    return null;
  }

  const fallback = await run("base");
  return fallback.data ? withDefaultReviewMetrics(fallback.data as T) : null;
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
