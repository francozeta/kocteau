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

type ReviewMetricsMode = "all";

function logReviewMetricsQueryError(
  scope: "runReviewListQuery" | "runReviewMaybeQuery",
  error: QueryError,
) {
  if (!error) {
    return;
  }

  console.error(`[review-likes.${scope}] failed`, {
    code: error.code ?? null,
    message: error.message ?? null,
  });
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
  const result = await run("all");

  if (result.error) {
    logReviewMetricsQueryError("runReviewListQuery", result.error);
    return [];
  }

  return ((result.data as T[] | null) ?? []).map(withDefaultReviewMetrics);
}

export async function runReviewMaybeQuery<
  T extends { likes_count?: number | null; comments_count?: number | null },
>(
  run: (mode: ReviewMetricsMode) => Promise<QueryResult<unknown>>,
) {
  const result = await run("all");

  if (result.error) {
    logReviewMetricsQueryError("runReviewMaybeQuery", result.error);
    return null;
  }

  return result.data ? withDefaultReviewMetrics(result.data as T) : null;
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
