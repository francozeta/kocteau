import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Music2 } from "lucide-react";
import FollowProfileButton from "@/components/follow-profile-button";
import JsonLd from "@/components/json-ld";
import NewReviewDialog from "@/components/new-review-dialog";
import PrefetchLink from "@/components/prefetch-link";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FeedReviewCard } from "@/components/review-route-cards-server";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const hasSecondaryRail = activeUsersRail.length > 0;
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

  const feedCards = orderedFeed.length > 0 ? (
    orderedFeed.map((review, index) => {
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
    })
  ) : (
    <Empty className="rounded-[1.2rem] border-border/42 bg-card/40 px-6 py-10 md:border-border/34 md:bg-card/32">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Music2 className="size-4" />
        </EmptyMedia>
        <EmptyTitle>No reviews yet</EmptyTitle>
        <EmptyDescription>Start with a review.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
  const peopleCards = activeUsersRail.map((profile) => {
    const primaryLabel = profile.display_name ?? `@${profile.username}`;

    return (
      <div
        key={profile.id}
        className="rounded-[1rem] bg-card/44 p-3 ring-1 ring-white/[0.06]"
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
  });

  function renderFeedControls() {
    return (
      <div className="inline-flex items-center rounded-full bg-black/20 p-1 ring-1 ring-white/[0.08]">
        {feedViews.map((view) => {
          const isActive = activeView === view.value;

          return (
            <Link
              key={view.value}
              href={getFeedViewHref(view.value)}
              className={cn(
                "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-card/90 text-foreground ring-1 ring-white/[0.08]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {view.label}
            </Link>
          );
        })}
      </div>
    );
  }

  function renderFeedCta() {
    return (
      <NewReviewDialog
        isAuthenticated={Boolean(user)}
        triggerClassName="h-10 rounded-lg bg-white px-4 text-black hover:bg-white/92"
        triggerLabelClassName="inline"
      />
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd data={feedStructuredData} id="home-structured-data" />
      <div className="flex h-full min-h-0 flex-col">
        <section className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            {renderFeedControls()}
            {renderFeedCta()}
          </div>

          <div className="space-y-4">
            {feedCards}
          </div>

          {hasSecondaryRail ? (
            <aside className="space-y-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  People
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {peopleCards}
              </div>
            </aside>
          ) : null}
        </section>

        <section className="hidden min-h-0 flex-1 lg:flex">
          <div className="mx-auto flex min-h-0 w-full max-w-[75rem] items-start justify-center gap-5 xl:gap-6">
            <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-[1rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.012))] ring-1 ring-white/[0.045]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.024),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.012),transparent_18%)]" />

              <div className="relative flex min-h-0 flex-1 flex-col bg-background/40">
                <div className="shrink-0 bg-background/72 px-5 py-5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl xl:px-6">
                  <div className="mx-auto flex w-full max-w-[42rem] items-start justify-between gap-4">
                    <div className="min-w-0 space-y-3">
                      {renderFeedControls()}
                    </div>

                    <div className="shrink-0">
                      {renderFeedCta()}
                    </div>
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <div className="mx-auto flex w-full max-w-[42rem] flex-col gap-4 px-5 py-5 xl:px-6">
                    {Boolean(user) ? (
                      <div className="rounded-[0.95rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.024),rgba(255,255,255,0.012))] px-4 py-4 ring-1 ring-white/[0.06]">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">Share what you are hearing</p>
                            <p className="text-xs text-muted-foreground">
                              Search a track, rate it, and drop a quick note without leaving the feed.
                            </p>
                          </div>
                          <div className="shrink-0">
                            {renderFeedCta()}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-3.5">
                      {feedCards}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HydrationBoundary>
  );
}
