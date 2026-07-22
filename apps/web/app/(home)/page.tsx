import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import ReactQueryProvider from "@/app/providers/react-query-provider";
import { circular, redaction } from "@/app/landing-fonts";
import AppShell from "@/components/app-shell";
import { OnboardingWelcomeFromUrl } from "@/components/auth/onboarding-welcome-dialog";
import FeedReviewList from "@/components/feed-review-list";
import FeedViewTabs from "@/components/feed-view-tabs";
import GuestHeader from "@/components/guest-header";
import GuestHome from "@/components/guest-home";
import JsonLd from "@/components/json-ld";
import { getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import { isFeedView } from "@/lib/feed-view";
import { createPageMetadata } from "@/lib/metadata";
import { measureServerTask } from "@/lib/perf";
import { getFeedPage, getFeedViewerState } from "@/lib/queries/feed";
import {
  getPublicStarterTracks,
  getStarterTracksForSurface,
} from "@/lib/queries/starter";
import { createServerQueryClient } from "@/lib/react-query/server";
import {
  buildFeedPageJsonLd,
  buildHomePageJsonLd,
} from "@/lib/structured-data";
import { feedKeys, type FeedInfiniteQueryData } from "@/queries/feed";

export const metadata = createPageMetadata({
  title: "Music reviews from real listeners",
  description:
    "Keep a record of what music leaves behind. Read track reviews, save listening notes, and discover music through people whose taste you trust.",
  path: "/",
});

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; welcome?: string }>;
}) {
  const params = await searchParams;
  const requestedView =
    isFeedView(params.view) && params.view !== "latest" ? params.view : null;
  const user = await measureServerTask("getHomeViewer", getCurrentUser, {
    route: "/",
  });
  const activeView = user ? requestedView ?? "for-you" : "latest";
  const tabActiveView = activeView === "latest" ? "for-you" : activeView;

  const starterTracksPromise = user?.id
    ? getStarterTracksForSurface({
        viewerId: user.id,
        limit: 6,
        surface: "home",
        contextKey: "home",
      })
    : getPublicStarterTracks({ limit: 6, contextKey: "home" });

  const [publicBundle, starterTracks, viewerProfile] = await measureServerTask(
    "getHomePrimaryData",
    () =>
      Promise.all([
        getFeedPage({
          view: activeView,
          viewerId: user?.id,
          includeActiveUsers: false,
        }),
        starterTracksPromise,
        user ? getCurrentViewerProfile() : Promise.resolve(null),
      ]),
    {
      route: "/",
      view: activeView,
      authenticated: Boolean(user),
    },
  );

  const viewerState =
    user?.id && publicBundle.feed.length > 0
      ? await getFeedViewerState(
          user.id,
          publicBundle.feed.map((review) => review.id),
        )
      : {
          likedReviewIds: new Set<string>(),
          bookmarkedReviewIds: new Set<string>(),
        };

  const feedData = {
    feed: publicBundle.feed.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
    activeUsers: [],
    nextCursor: publicBundle.nextCursor,
    view: publicBundle.view,
    requiresAuth:
      (activeView === "following" || activeView === "for-you") && !user,
  };

  const guestRecentPage = {
    ...feedData,
    feed: feedData.feed.slice(0, 3),
    nextCursor: null,
  };
  const hydratedFeedData = user ? feedData : guestRecentPage;
  const queryClient = createServerQueryClient();

  queryClient.setQueryData(feedKeys.bundle(activeView), hydratedFeedData);
  queryClient.setQueryData<FeedInfiniteQueryData>(feedKeys.infinite(activeView), {
    pages: [hydratedFeedData],
    pageParams: [null],
  });

  const feedStructuredData = buildFeedPageJsonLd(
    feedData.feed
      .flatMap((review) => {
        const entity = review.entities;
        const author = review.author;

        if (!entity?.id || !author?.username) {
          return [];
        }

        return [
          {
            reviewId: review.id,
            reviewTitle: review.title,
            reviewBody: review.body,
            rating: review.rating,
            entity: {
              id: entity.id,
              provider: entity.provider,
              providerId: entity.provider_id,
              type: entity.type,
              title: entity.title,
              artistName: entity.artist_name,
              coverUrl: entity.cover_url,
            },
            author: {
              username: author.username,
              displayName: author.display_name,
            },
          },
        ];
      })
      .slice(0, 10),
  );
  const homeStructuredData = buildHomePageJsonLd();

  if (user) {
    return (
      <AppShell variant="feed">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <JsonLd data={homeStructuredData} id="home-page-structured-data" />
          <JsonLd data={feedStructuredData} id="home-structured-data" />
          {params.welcome === "kocteau" ? <OnboardingWelcomeFromUrl /> : null}
          <section className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6 lg:mx-0 lg:max-w-none lg:space-y-4">
            <div className="lg:hidden">
              <FeedViewTabs activeView={tabActiveView} fullWidth />
            </div>
            <div className="hidden justify-start lg:flex">
              <FeedViewTabs activeView={tabActiveView} />
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
      </AppShell>
    );
  }

  return (
    <ReactQueryProvider>
      <div className={`${circular.variable} ${redaction.variable} kocteau-guest-typography min-h-svh overflow-x-clip bg-[var(--kocteau-shell)] text-foreground`}>
        <GuestHeader />
        <main className="pt-15 sm:pt-16">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <JsonLd data={homeStructuredData} id="home-page-structured-data" />
            <JsonLd data={feedStructuredData} id="home-structured-data" />
            <GuestHome
              recentPage={guestRecentPage}
              starterTracks={starterTracks}
            />
          </HydrationBoundary>
        </main>
      </div>
    </ReactQueryProvider>
  );
}
