export type FeedView = "for-you" | "latest" | "following" | "top-rated";

export type RecommendationReason =
  | "entity_taste"
  | "taste_match"
  | "following"
  | "familiar_entity"
  | "author_affinity"
  | "popular_recent";

export function isFeedView(value: string | undefined): value is FeedView {
  return (
    value === "for-you" ||
    value === "latest" ||
    value === "following" ||
    value === "top-rated"
  );
}
