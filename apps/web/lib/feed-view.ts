export type FeedView = "latest" | "top-rated";

export function isFeedView(value: string | undefined): value is FeedView {
  return value === "latest" || value === "top-rated";
}
