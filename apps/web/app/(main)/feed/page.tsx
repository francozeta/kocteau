import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { OnboardingWelcomeFromUrl } from "@/components/auth/onboarding-welcome-dialog";
import FeedReviewList from "@/components/feed-review-list";
import FeedViewTabs from "@/components/feed-view-tabs";
import { getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import { isFeedView, type FeedView } from "@/lib/feed-view";
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

function getAuthenticatedFeedView(value: string | undefined): FeedView {
  return isFeedView(value) && value !== "latest" ? value : "for-you";
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; welcome?: string }>;
}) {
  const [params, user] = await Promise.all([
    searchParams,
    measureServerTask("getFeedViewer", getCurrentUser, { route: "/feed" }),
  ]);

  if (!user) {
    redirect("/login?next=/feed");
  }

  const activeView = getAuthenticatedFeedView(params.view);
  const [feedPage, starterTracks, viewerProfile] = await measureServerTask(
    "getAuthenticatedFeedData",
    () =>
      Promise.all([
        getFeedPage({
          view: activeView,
          viewerId: user.id,
          includeActiveUsers: false,
        }),
        getStarterTracksForSurface({
          viewerId: user.id,
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
          user.id,
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
      <section className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6 lg:mx-0 lg:max-w-none lg:space-y-4">
        <div className="lg:hidden">
          <FeedViewTabs activeView={activeView} fullWidth />
        </div>
        <div className="hidden justify-start lg:flex">
          <FeedViewTabs activeView={activeView} />
        </div>
        <div className="space-y-4">
          <FeedReviewList
            view={activeView}
            initialPage={feedData}
            isAuthenticated
            viewer={viewerProfile}
            starterTracks={starterTracks}
            showReviewCta={false}
          />
        </div>
      </section>
    </HydrationBoundary>
  );
}
