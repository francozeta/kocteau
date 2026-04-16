import "server-only";

type ReviewMetricsMode = "all";

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
    "likes_count",
    "comments_count",
    ...(includePinned ? ["is_pinned"] : []),
    "created_at",
    ...(includeEntity
      ? [
          `entities (
            id,
            provider,
            provider_id,
            type,
            title,
            artist_name,
            cover_url,
            deezer_url
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
