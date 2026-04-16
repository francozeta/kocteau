export type FeedView = "latest" | "following" | "top-rated";

export function isFeedView(value: string | undefined): value is FeedView {
  return value === "latest" || value === "following" || value === "top-rated";
}
