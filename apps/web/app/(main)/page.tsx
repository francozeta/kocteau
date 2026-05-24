import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import FeedViewTabs from "@/components/feed-view-tabs";
import FeedReviewList from "@/components/feed-review-list";
import JsonLd from "@/components/json-ld";
import { OnboardingWelcomeFromUrl } from "@/components/auth/onboarding-welcome-dialog";
import { getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import { isFeedView } from "@/lib/feed-view";
import { createPageMetadata } from "@/lib/metadata";
import {
  getFeedPage,
  getFeedViewerState,
} from "@/lib/queries/feed";
import { getStarterTracks } from "@/lib/queries/starter";
import { createServerQueryClient } from "@/lib/react-query/server";
import { buildFeedPageJsonLd } from "@/lib/structured-data";
import { feedKeys, type FeedInfiniteQueryData } from "@/queries/feed";

export const metadata = createPageMetadata({
  title: "Kocteau",
  description: "Music reviews by real listeners.",
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
  const userPromise = getCurrentUser();
  const viewerProfilePromise = getCurrentViewerProfile();
  const user = await userPromise;
  const activeView = requestedView ?? (user ? "for-you" : "latest");
  const tabActiveView = activeView === "latest" ? "for-you" : activeView;
  const [publicBundle, starterTracks] = await Promise.all([
    getFeedPage({
      view: activeView,
      viewerId: user?.id,
      includeActiveUsers: false,
    }),
    activeView === "for-you" && user?.id
      ? getStarterTracks({ viewerId: user.id, limit: 6 })
      : Promise.resolve([]),
  ]);
  const viewerStatePromise =
    user?.id && publicBundle.feed.length > 0
      ? getFeedViewerState(
          user.id,
          publicBundle.feed.map((review) => review.id),
        )
      : Promise.resolve({
          likedReviewIds: new Set<string>(),
          bookmarkedReviewIds: new Set<string>(),
        });
  const [viewerProfile, viewerState] = await Promise.all([
    viewerProfilePromise,
    viewerStatePromise,
  ]);
  const queryClient = createServerQueryClient();
  const feedData = {
    feed: publicBundle.feed.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
    activeUsers: [],
    nextCursor: publicBundle.nextCursor,
    view: publicBundle.view,
    requiresAuth: (activeView === "following" || activeView === "for-you") && !user,
  };

  queryClient.setQueryData(feedKeys.bundle(activeView), feedData);
  queryClient.setQueryData<FeedInfiniteQueryData>(feedKeys.infinite(activeView), {
    pages: [feedData],
    pageParams: [null],
  });

  const orderedFeed = feedData.feed;
  const feedStructuredData = buildFeedPageJsonLd(
    orderedFeed.flatMap((review) => {
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
    }).slice(0, 10),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd data={feedStructuredData} id="home-structured-data" />
      {params.welcome === "kocteau" ? <OnboardingWelcomeFromUrl /> : null}
      <div className="flex h-full min-h-0 flex-col">
        <section className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6 lg:mx-0 lg:max-w-none lg:space-y-4">
          {user ? (
            <>
              <div className="lg:hidden">
                <FeedViewTabs activeView={tabActiveView} fullWidth />
              </div>
              <div className="hidden justify-start lg:flex">
                <FeedViewTabs activeView={tabActiveView} />
              </div>
            </>
          ) : null}

          <div className="space-y-4">
            <FeedReviewList
              view={activeView}
              initialPage={feedData}
              isAuthenticated={Boolean(user)}
              viewer={viewerProfile}
              starterTracks={starterTracks}
            />
          </div>
        </section>
      </div>
    </HydrationBoundary>
  );
}
