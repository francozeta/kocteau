import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Music2 } from "lucide-react";
import PrefetchLink from "@/components/prefetch-link";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FeedReviewCard } from "@/components/review-route-cards";
import UserAvatar from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import {
  getFeedPublicBundle,
  getFeedViewerState,
  type FeedReview,
} from "@/lib/queries/feed";
import { createServerQueryClient } from "@/lib/react-query/server";
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
  title: "Feed",
  description: "Latest music reviews, ratings, and notes from the Kocteau feed.",
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
  const queryClient = createServerQueryClient();
  const feedData = {
    feed: publicBundle.feed.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
    activeUsers: publicBundle.activeUsers,
  };

  queryClient.setQueryData(feedKeys.bundle(), feedData);

  const orderedFeed = sortFeed(feedData.feed, activeView);
  const activeUsersRail = feedData.activeUsers.slice(0, 4);

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
              isAuthenticated={Boolean(user)}
              canManage={Boolean(user?.id && author?.id === user.id)}
            />
          );
        })}
      </div>
    </div>
  ) : (
    <Empty className="rounded-[1.75rem] border-border/25 bg-card/20 px-6 py-10">
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
                className="rounded-[1.25rem] border border-border/18 bg-card/14 p-2.5"
              >
                <div className="flex items-start gap-3">
                  <PrefetchLink
                    href={`/u/${profile.username}`}
                    className="group min-w-0 flex-1 rounded-[1.15rem] transition-colors hover:text-foreground"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        avatarUrl={profile.avatar_url}
                        displayName={profile.display_name}
                        username={profile.username}
                        className="size-10 shrink-0"
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

                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled
                    className="shrink-0 rounded-full border-border/18 bg-transparent px-2.5 text-[10px] text-muted-foreground/85 disabled:opacity-70"
                  >
                    Follow
                  </Button>
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
      <section className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <div className="border-b border-border/24 pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
                Feed
              </h1>
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
                        ? "border-border/22 bg-card/14 font-medium text-foreground"
                        : "border-transparent bg-transparent text-muted-foreground hover:bg-card/10 hover:text-foreground",
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
