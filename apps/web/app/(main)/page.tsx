import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Clock3, Music2, Search, Trophy } from "lucide-react";
import FollowProfileButton from "@/components/follow-profile-button";
import JsonLd from "@/components/json-ld";
import NewReviewDialog from "@/components/new-review-dialog";
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
    <Empty className="rounded-lg border-border/42 bg-card/40 px-6 py-10 md:border-border/34 md:bg-card/32">
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
        className="rounded-lg bg-card/44 p-3 ring-1 ring-white/[0.06]"
      >
        <div className="flex items-start gap-3">
          <PrefetchLink
            href={`/u/${profile.username}`}
            className="group min-w-0 flex-1 rounded-lg transition-colors hover:text-foreground"
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

  function renderFeedControls({ compact = false }: { compact?: boolean } = {}) {
    return (
      <div className="inline-flex items-center rounded-lg border border-border/42 bg-card/38 p-1">
        {feedViews.map((view) => {
          const isActive = activeView === view.value;
          const Icon = view.value === "latest" ? Clock3 : Trophy;

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
        trigger={
          <button
            type="button"
            className="flex h-11 w-full items-center gap-3 rounded-lg border border-border/42 bg-card/42 px-3.5 text-left text-muted-foreground transition-colors hover:border-border/58 hover:bg-card/58 hover:text-foreground"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate text-sm">Search tracks, albums, or artists to review...</span>
          </button>
        }
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

        <section className="hidden lg:block">
          <div className="mx-auto w-full max-w-[75rem]">
            <div className="mx-auto w-full max-w-[42rem] space-y-4">
              <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="min-w-0">
                  {renderFeedSearchTrigger()}
                </div>
                <div className="justify-self-start xl:justify-self-end">
                  {renderFeedControls()}
                </div>
              </div>

              <div className="space-y-3.5">
                {feedCards}
              </div>
            </div>
          </div>
        </section>
      </div>
    </HydrationBoundary>
  );
}
