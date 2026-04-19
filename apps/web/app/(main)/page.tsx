import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Clock3, Sparkles, Trophy, UsersRound } from "lucide-react";
import FeedReviewList from "@/components/feed-review-list";
import JsonLd from "@/components/json-ld";
import NewReviewDialog from "@/components/new-review-dialog";
import WhoToFollowRail from "@/components/who-to-follow-rail";
import { getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import { isFeedView, type FeedView } from "@/lib/feed-view";
import { createPageMetadata } from "@/lib/metadata";
import {
  getFeedPage,
  getFeedViewerState,
} from "@/lib/queries/feed";
import { createServerQueryClient } from "@/lib/react-query/server";
import { buildFeedPageJsonLd } from "@/lib/structured-data";
import { cn } from "@/lib/utils";
import { feedKeys, type FeedInfiniteQueryData } from "@/queries/feed";

const feedViews: Array<{
  value: FeedView;
  label: string;
}> = [
  {
    value: "for-you",
    label: "For You",
  },
  {
    value: "latest",
    label: "Latest",
  },
  {
    value: "following",
    label: "Following",
  },
  {
    value: "top-rated",
    label: "Top",
  },
];

function getFeedViewHref(view: FeedView) {
  return `/?view=${view}`;
}

export const metadata = createPageMetadata({
  title: "Music Reviews, Ratings, and Discovery",
  description:
    "Read recent music reviews, ratings, and listening notes, discover active tracks, and explore public profiles on Kocteau.",
  path: "/",
});

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const requestedView = isFeedView(params.view) ? params.view : null;
  const userPromise = getCurrentUser();
  const viewerProfilePromise = getCurrentViewerProfile();
  const [user, viewerProfile] = await Promise.all([userPromise, viewerProfilePromise]);
  const activeView = requestedView ?? (user ? "for-you" : "latest");
  const publicBundle = await getFeedPage({
    view: activeView,
    viewerId: user?.id,
    includeActiveUsers: false,
  });
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
  const viewerState = await viewerStatePromise;
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

  function renderFeedControls({ compact = false }: { compact?: boolean } = {}) {
    return (
      <div className="inline-flex items-center rounded-lg border border-border/42 bg-card/38 p-1">
        {feedViews.map((view) => {
          const isActive = activeView === view.value;
          const Icon =
            view.value === "for-you"
              ? Sparkles
              : view.value === "latest"
              ? Clock3
              : view.value === "following"
                ? UsersRound
                : Trophy;

          return (
            <Link
              key={view.value}
              href={getFeedViewHref(view.value)}
              aria-label={view.label}
              title={view.label}
              className={cn(
                "inline-flex h-9 items-center rounded-md text-sm transition-colors",
                compact ? "w-9 justify-center px-0" : "px-3.5",
                isActive
                  ? "border border-border/48 bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {compact ? <Icon className="size-4" /> : view.label}
            </Link>
          );
        })}
      </div>
    );
  }

  function renderFeedSearchTrigger() {
    return (
      <NewReviewDialog
        isAuthenticated={Boolean(user)}
        triggerVariant="search"
        triggerLabel="Search tracks, albums, or artists to review..."
      />
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd data={feedStructuredData} id="home-structured-data" />
      <div className="flex h-full min-h-0 flex-col">
        <section className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              {renderFeedSearchTrigger()}
            </div>
            <div className="shrink-0">
              {renderFeedControls({ compact: true })}
            </div>
          </div>

          <div className="space-y-4">
            <FeedReviewList
              view={activeView}
              initialPage={feedData}
              isAuthenticated={Boolean(user)}
              viewer={viewerProfile}
            />
          </div>
        </section>

        <section className="hidden lg:block">
          <div className="mx-auto w-full max-w-[75rem]">
            <div
              className="mx-auto grid w-full gap-5 lg:grid-cols-[minmax(0,42rem)_17rem] lg:justify-center"
            >
              <div className="min-w-0 space-y-4">
                <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                  <div className="min-w-0">
                    {renderFeedSearchTrigger()}
                  </div>
                  <div className="justify-self-start xl:justify-self-end">
                    {renderFeedControls()}
                  </div>
                </div>

                <FeedReviewList
                  view={activeView}
                  initialPage={feedData}
                  isAuthenticated={Boolean(user)}
                  viewer={viewerProfile}
                />
              </div>

              <WhoToFollowRail isAuthenticated={Boolean(user)} />
            </div>
          </div>
        </section>
      </div>
    </HydrationBoundary>
  );
}
