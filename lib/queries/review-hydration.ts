import "server-only";

type ReviewMetricsMode = "all" | "likes-only" | "base";

type ReviewHydrationOptions = {
  includeAuthor?: boolean;
  includeEntity?: boolean;
  includePinned?: boolean;
};

export function buildReviewHydrationSelect(
  mode: ReviewMetricsMode,
  {
    includeAuthor = false,
    includeEntity = false,
    includePinned = false,
  }: ReviewHydrationOptions = {},
) {
  return [
    "id",
    "title",
    "body",
    "rating",
    ...(mode !== "base" ? ["likes_count"] : []),
    ...(mode === "all" ? ["comments_count"] : []),
    ...(includePinned ? ["is_pinned"] : []),
    "created_at",
    ...(includeEntity
      ? [
          `entities (
            id,
            title,
            artist_name,
            cover_url
          )`,
        ]
      : []),
    ...(includeAuthor
      ? [
          `author:profiles!reviews_author_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )`,
        ]
      : []),
  ].join(",");
}
