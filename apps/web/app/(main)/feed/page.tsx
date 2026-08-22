import { redirect } from "next/navigation";

import { OnboardingWelcomeFromUrl } from "@/components/auth/onboarding-welcome-dialog";
import AuthenticatedFeedSurface from "@/components/authenticated-feed-surface";
import { getCurrentUserId, getCurrentViewerProfile } from "@/lib/auth/server";
import { getAuthenticatedFeedView } from "@/lib/feed-view";
import { createPageMetadata } from "@/lib/metadata";
import { measureServerTask } from "@/lib/perf";
import { getFeedPage, getFeedViewerState } from "@/lib/queries/feed";
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
        const feedPagePromise = getFeedPage({
          view: activeView,
          viewerId: userId,
          includeActiveUsers: false,
        });
        const starterTracksPromise = getStarterTracksForSurface({
          viewerId: userId,
          limit: 6,
          surface: "home",
          contextKey: "home",
        });
        const viewerProfilePromise = getCurrentViewerProfile();
        const feedPage = await feedPagePromise;
        const viewerStatePromise =
          feedPage.feed.length > 0
            ? getFeedViewerState(
                userId,
                feedPage.feed.map((review) => review.id),
              )
            : Promise.resolve({
                likedReviewIds: new Set<string>(),
                bookmarkedReviewIds: new Set<string>(),
              });
        const [starterTracks, viewerProfile, viewerState] = await Promise.all([
          starterTracksPromise,
          viewerProfilePromise,
          viewerStatePromise,
        ]);

        return { feedPage, starterTracks, viewerProfile, viewerState };
      },
      { route: "/feed", view: activeView },
    );
  const feedData = {
    ...feedPage,
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
