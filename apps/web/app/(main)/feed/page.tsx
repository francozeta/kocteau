import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { OnboardingWelcomeFromUrl } from "@/components/auth/onboarding-welcome-dialog";
import AuthenticatedFeedSurface from "@/components/authenticated-feed-surface";
import { getCurrentUserId, getCurrentViewerProfile } from "@/lib/auth/server";
import { getAuthenticatedFeedView } from "@/lib/feed-view";
import { createPageMetadata } from "@/lib/metadata";
import { measureServerTask } from "@/lib/perf";
import { getFeedPage, getFeedViewerState } from "@/lib/queries/feed";
import { getStarterTracksForSurface } from "@/lib/queries/starter";
import { createServerQueryClient } from "@/lib/react-query/server";
import { feedKeys, type FeedInfiniteQueryData } from "@/queries/feed";

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
  const [feedPage, starterTracks, viewerProfile] = await measureServerTask(
    "getAuthenticatedFeedData",
    () =>
      Promise.all([
        getFeedPage({
          view: activeView,
          viewerId: userId,
          includeActiveUsers: false,
        }),
        getStarterTracksForSurface({
          viewerId: userId,
          limit: 6,
          surface: "home",
          contextKey: "home",
        }),
        getCurrentViewerProfile(),
      ]),
    { route: "/feed", view: activeView },
  );
  const viewerState =
    feedPage.feed.length > 0
      ? await getFeedViewerState(
          userId,
          feedPage.feed.map((review) => review.id),
        )
      : {
          likedReviewIds: new Set<string>(),
          bookmarkedReviewIds: new Set<string>(),
        };
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
  const queryClient = createServerQueryClient();

  queryClient.setQueryData(feedKeys.bundle(activeView), feedData);
  queryClient.setQueryData<FeedInfiniteQueryData>(feedKeys.infinite(activeView), {
    pages: [feedData],
    pageParams: [null],
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {params.welcome === "kocteau" ? <OnboardingWelcomeFromUrl /> : null}
      <AuthenticatedFeedSurface
        initialView={activeView}
        initialPage={feedData}
        viewer={viewerProfile}
        starterTracks={starterTracks}
      />
    </HydrationBoundary>
  );
}
