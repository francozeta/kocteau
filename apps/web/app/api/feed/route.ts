import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isFeedView } from "@/lib/feed-view";
import { getFeedPage, getFeedViewerState } from "@/lib/queries/feed";
import { getViewerFollowingProfileIds } from "@/lib/queries/profile-follows";
import { measureServerTask } from "@/lib/perf";

async function getFeedResponse(req: Request) {
  const url = new URL(req.url);
  const viewParam = url.searchParams.get("view") ?? undefined;
  const cursor = url.searchParams.get("cursor");
  const user = await getCurrentUser();
  const activeView = isFeedView(viewParam) ? viewParam : user ? "for-you" : "latest";
  const bundle = await getFeedPage({
    view: activeView,
    viewerId: user?.id,
    cursor,
    includeActiveUsers: false,
  });
  const activeUsers = bundle.activeUsers.filter((profile) => profile.id !== user?.id);
  const viewerState =
    user?.id && bundle.feed.length > 0
      ? await getFeedViewerState(
          user.id,
          bundle.feed.map((review) => review.id),
        )
      : {
          likedReviewIds: new Set<string>(),
          bookmarkedReviewIds: new Set<string>(),
        };
  const followedProfileIds =
    user?.id && activeUsers.length > 0
      ? await getViewerFollowingProfileIds(
          user.id,
          activeUsers.map((profile) => profile.id),
        )
      : new Set<string>();

  return NextResponse.json({
    feed: bundle.feed.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
    activeUsers: activeUsers.map((profile) => ({
      ...profile,
      viewer_is_following: followedProfileIds.has(profile.id),
    })),
    nextCursor: bundle.nextCursor,
    view: bundle.view,
    requiresAuth: (activeView === "following" || activeView === "for-you") && !user,
  });
}

export async function GET(req: Request) {
  return measureServerTask("GET /api/feed", () => getFeedResponse(req), {
    route: "/api/feed",
  });
}
