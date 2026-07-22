export type FeedView = "for-you" | "latest" | "following" | "top-rated";

export type RecommendationReason =
  | "entity_taste"
  | "taste_match"
  | "following"
  | "familiar_entity"
  | "author_affinity"
  | "own_review"
  | "popular_recent";

export function isFeedView(
  value: string | null | undefined,
): value is FeedView {
  return (
    value === "for-you" ||
    value === "latest" ||
    value === "following" ||
    value === "top-rated"
  );
}

export function getAuthenticatedFeedView(
  value: string | null | undefined,
): Exclude<FeedView, "latest"> {
  return isFeedView(value) && value !== "latest" ? value : "for-you";
}

export function getFeedViewHref(view: FeedView) {
  return view === "for-you" ? "/feed" : `/feed?view=${view}`;
}
