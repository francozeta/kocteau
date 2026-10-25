import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/server";
import { isFeedView } from "@/lib/feed-view";
import { getFeedPageBundle, type FeedPageBundle } from "@/lib/queries/feed";
import { getViewerFollowingProfileIds } from "@/lib/queries/profile-follows";
import { measureServerTask } from "@/lib/perf";

async function getFeedResponse(req: Request) {
  const url = new URL(req.url);
  const viewParam = url.searchParams.get("view") ?? undefined;
  const cursor = url.searchParams.get("cursor");
  const userId = await getCurrentUserId();
  const activeView = isFeedView(viewParam)
    ? viewParam
    : userId
      ? "for-you"
      : "latest";
  let bundle: FeedPageBundle;
  try {
    bundle = await getFeedPageBundle(userId, activeView, {
      cursor,
      includeActiveUsers: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Reviews are temporarily unavailable. Please try again." },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store", "Retry-After": "5" },
      },
    );
  }
  const activeUsers = bundle.activeUsers.filter(
    (profile) => profile.id !== userId,
  );
  const followedProfileIds =
    userId && activeUsers.length > 0
      ? await getViewerFollowingProfileIds(
          userId,
          activeUsers.map((profile) => profile.id),
        )
      : new Set<string>();

  return NextResponse.json(
    {
      feed: bundle.feed.map((review) => ({
        ...review,
        viewer_has_liked: bundle.likedReviewIds.has(review.id),
        viewer_has_bookmarked: bundle.bookmarkedReviewIds.has(review.id),
      })),
      activeUsers: activeUsers.map((profile) => ({
        ...profile,
        viewer_is_following: followedProfileIds.has(profile.id),
      })),
      nextCursor: bundle.nextCursor,
      view: bundle.view,
      requiresAuth:
        (activeView === "following" || activeView === "for-you") && !userId,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function GET(req: Request) {
  return measureServerTask("GET /api/feed", () => getFeedResponse(req), {
    route: "/api/feed",
  });
}
