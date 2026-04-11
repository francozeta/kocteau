import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Music2 } from "lucide-react";
import FollowProfileButton from "@/components/follow-profile-button";
import JsonLd from "@/components/json-ld";
import PrefetchLink from "@/components/prefetch-link";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FeedReviewCard } from "@/components/review-route-cards-server";
import UserAvatar from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import {
  getFeedPublicBundle,
  getFeedViewerState,
  type FeedReview,
} from "@/lib/queries/feed";
import { getViewerFollowingProfileIds } from "@/lib/queries/profile-follows";
import { createServerQueryClient } from "@/lib/react-query/server";
import { buildFeedPageJsonLd } from "@/lib/structured-data";
import { cn } from "@/lib/utils";
import { feedKeys } from "@/queries/feed";

type FeedView = "latest" | "top-rated";

const feedViews: Array<{
  value: FeedView;
  label: string;
}> = [
  {
    value: "latest",
    label: "Latest",
  },
  {
    value: "top-rated",
    label: "Top",
  },
];

function isFeedView(value: string | undefined): value is FeedView {
  return value === "latest" || value === "top-rated";
}

function getFeedViewHref(view: FeedView) {
  return view === "latest" ? "/" : `/?view=${view}`;
}

function getEntity(review: FeedReview) {
  if (Array.isArray(review.entities)) {
    return review.entities[0] ?? null;
  }

  return review.entities;
}

function getAuthor(review: FeedReview) {
  if (Array.isArray(review.author)) {
    return review.author[0] ?? null;
  }

  return review.author;
}

function sortFeed(feed: FeedReview[], view: FeedView) {
  if (view !== "top-rated") {
    return feed;
  }

  return [...feed].sort((left, right) => {
    if (right.rating !== left.rating) {
      return right.rating - left.rating;
    }

    return (
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );
  });
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
  const activeView = isFeedView(params.view) ? params.view : "latest";
  const userPromise = getCurrentUser();
  const publicBundlePromise = getFeedPublicBundle();
  const [user, publicBundle] = await Promise.all([userPromise, publicBundlePromise]);
  const activeUsers = publicBundle.activeUsers.filter((profile) => profile.id !== user?.id);
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
  const followingProfileIdsPromise =
    user?.id && activeUsers.length > 0
      ? getViewerFollowingProfileIds(
          user.id,
          activeUsers.map((profile) => profile.id),
        )
      : Promise.resolve(new Set<string>());
  const [viewerState, followingProfileIds] = await Promise.all([
    viewerStatePromise,
    followingProfileIdsPromise,
  ]);
  const queryClient = createServerQueryClient();
  const feedData = {
    feed: publicBundle.feed.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
    activeUsers: activeUsers.map((profile) => ({
      ...profile,
      viewer_is_following: followingProfileIds.has(profile.id),
    })),
  };

  queryClient.setQueryData(feedKeys.bundle(), feedData);

  const orderedFeed = sortFeed(feedData.feed, activeView);
  const activeUsersRail = feedData.activeUsers.slice(0, 4);
  const feedStructuredData = buildFeedPageJsonLd(
    orderedFeed.flatMap((review) => {
      const entity = getEntity(review);
      const author = getAuthor(review);

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

  const reviewsSection = orderedFeed.length > 0 ? (
    <div className="space-y-4">
      <div className="space-y-4">
        {orderedFeed.map((review, index) => {
          const entity = getEntity(review);
          const author = getAuthor(review);

          return (
            <FeedReviewCard
              key={review.id}
              review={review}
              entity={entity}
              author={author}
              featured={index === 0}
              showInteractionBar={Boolean(user)}
              isAuthenticated={Boolean(user)}
              canManage={Boolean(user?.id && author?.id === user.id)}
            />
          );
        })}
      </div>
    </div>
  ) : (
    <Empty className="rounded-[1.2rem] border-border/42 bg-card/40 px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:border-border/34 md:bg-card/32">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Music2 className="size-4" />
        </EmptyMedia>
        <EmptyTitle>No reviews yet</EmptyTitle>
        <EmptyDescription>Start with a review.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
  const secondaryRail = activeUsersRail.length > 0 ? (
    <aside className="space-y-3 xl:sticky xl:top-24">
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            People
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {activeUsersRail.map((profile) => {
            const primaryLabel = profile.display_name ?? `@${profile.username}`;

            return (
              <div
                key={profile.id}
                className="rounded-[1rem] border border-border/40 bg-card/40 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/32 md:bg-card/30"
              >
                <div className="flex items-start gap-3">
                  <PrefetchLink
                    href={`/u/${profile.username}`}
                    className="group min-w-0 flex-1 rounded-[0.95rem] transition-colors hover:text-foreground"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        avatarUrl={profile.avatar_url}
                        displayName={profile.display_name}
                        username={profile.username}
                        className="size-10 shrink-0"
                        sizes="40px"
                        initialsLength={2}
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-[14px] font-medium text-foreground">
                          {primaryLabel}
                        </p>
                        <p className="truncate text-[12.5px] text-muted-foreground">
                          @{profile.username}
                        </p>
                      </div>
                    </div>
                  </PrefetchLink>

                  {user ? (
                    <FollowProfileButton
                      profileId={profile.id}
                      initialFollowing={Boolean(profile.viewer_is_following)}
                      isAuthenticated
                      size="xs"
                      className="shrink-0 px-2.5 text-[10px]"
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  ) : null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd data={feedStructuredData} id="home-structured-data" />
      <section className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <div className="border-b border-border/32 pb-3 md:border-border/24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Feed
              </p>
              <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
                Recent music reviews and listening notes
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Discover what people are hearing, rating, and writing about right now.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {feedViews.map((view) => {
                const isActive = activeView === view.value;

                return (
                  <Link
                    key={view.value}
                    href={getFeedViewHref(view.value)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "border-border/34 bg-card/24 font-medium text-foreground md:border-border/24 md:bg-card/16"
                        : "border-transparent bg-transparent text-muted-foreground hover:bg-card/18 hover:text-foreground md:hover:bg-card/10",
                    )}
                  >
                    {view.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18.5rem] xl:items-start">
          <div className="min-w-0">
            {reviewsSection}
          </div>

          {secondaryRail}
        </div>
      </section>
    </HydrationBoundary>
  );
}
