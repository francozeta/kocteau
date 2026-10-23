import { redirect } from "next/navigation";

import { OnboardingWelcomeFromUrl } from "@/components/auth/onboarding-welcome-dialog";
import AuthenticatedFeedSurface from "@/components/feed/authenticated-feed-surface";
import { getCurrentUserId, getCurrentViewerProfile } from "@/lib/auth/server";
import { getAuthenticatedFeedView } from "@/lib/feed-view";
import { createPageMetadata } from "@/lib/metadata";
import { measureServerTask } from "@/lib/perf";
import { getFeedPageBundle } from "@/lib/queries/feed";
import { getStarterTracksForSurface } from "@/lib/queries/starter";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Feed",
  description: "Your Kocteau music review feed.",
  path: "/feed",
  noIndex: true,
});

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; welcome?: string }>;
}) {
  const [params, userId] = await Promise.all([
    searchParams,
    measureServerTask("getFeedViewer", getCurrentUserId, { route: "/feed" }),
  ]);

  if (!userId) {
    redirect("/login?next=/feed");
  }

  const activeView = getAuthenticatedFeedView(params.view);
  const { feedPage, starterTracks, viewerProfile, viewerState } =
    await measureServerTask(
      "getAuthenticatedFeedData",
      async () => {
        const feedPagePromise = getFeedPageBundle(userId, activeView, {
          includeActiveUsers: false,
        });
        const starterTracksPromise = getStarterTracksForSurface({
          viewerId: userId,
          limit: 6,
          surface: "home",
          contextKey: "home",
        });
        const viewerProfilePromise = getCurrentViewerProfile();
        const [feedPage, starterTracks, viewerProfile] = await Promise.all([
          feedPagePromise,
          starterTracksPromise,
          viewerProfilePromise,
        ]);
        const viewerState = {
          likedReviewIds: feedPage.likedReviewIds,
          bookmarkedReviewIds: feedPage.bookmarkedReviewIds,
        };

        return { feedPage, starterTracks, viewerProfile, viewerState };
      },
      { route: "/feed", view: activeView },
    );
  const feedData = {
    view: feedPage.view,
    nextCursor: feedPage.nextCursor,
    activeUsers: [],
    feed: feedPage.feed.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
    requiresAuth: false,
  };
  return (
    <>
      {params.welcome === "kocteau" ? <OnboardingWelcomeFromUrl /> : null}
      <AuthenticatedFeedSurface
        initialView={activeView}
        initialPage={feedData}
        viewer={viewerProfile}
        starterTracks={starterTracks}
      />
    </>
  );
}
