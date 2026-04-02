import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Music2 } from "lucide-react";
import PrefetchLink from "@/components/prefetch-link";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FeedReviewCard } from "@/components/review-route-cards";
import UserAvatar from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getFeedPageBundle, type FeedReview } from "@/lib/queries/feed";
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
    label: "Top Rated",
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

function formatReviewCount(count: number) {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
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
  const user = await getCurrentUser();
  const bundle = await getFeedPageBundle(user?.id);
  const queryClient = createServerQueryClient();
  const feedData = {
    feed: bundle.feed.map((review) => ({
      ...review,
      viewer_has_liked: bundle.likedReviewIds.has(review.id),
      viewer_has_bookmarked: bundle.bookmarkedReviewIds.has(review.id),
    })),
    activeUsers: bundle.activeUsers,
  };

  queryClient.setQueryData(feedKeys.bundle(), feedData);

  const orderedFeed = sortFeed(feedData.feed, activeView);
  const activeUsersRail = feedData.activeUsers.slice(0, 4);
  const reviewsHeading =
    activeView === "top-rated" ? "Top Rated Reviews" : "Latest Reviews";
  const reviewsSubcopy =
    activeView === "top-rated" ? "Sorted by rating first" : "Newest first";

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
        <EmptyDescription>
          Start a new review and the feed will pick it up here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );

  const secondaryRail = activeUsersRail.length > 0 ? (
    <div className="space-y-3.5">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Active Reviewers
        </p>
        <p className="text-xs text-muted-foreground">
          People publishing lately across the feed.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
        {activeUsersRail.map((profile) => {
          const primaryLabel = profile.display_name ?? `@${profile.username}`;
          const latestTrackLabel = [
            profile.latest_track_title,
            profile.latest_track_artist_name,
          ]
            .filter(Boolean)
            .join(" — ");

          return (
            <div
              key={profile.id}
              className="rounded-[1.35rem] border border-border/18 bg-card/16 p-3"
            >
              <PrefetchLink
                href={`/u/${profile.username}`}
                className="group block rounded-[1.15rem] transition-colors hover:text-foreground"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar
                    avatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    username={profile.username}
                    className="size-11 shrink-0"
                    initialsLength={2}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-foreground">
                          {primaryLabel}
                        </p>
                        <p className="truncate text-[12.5px] text-muted-foreground">
                          @{profile.username}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-border/18 bg-muted/18 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {formatReviewCount(profile.review_count)}
                      </span>
                    </div>

                    {latestTrackLabel ? (
                      <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-foreground/78">
                        Latest on {latestTrackLabel}
                      </p>
                    ) : (
                      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                        Open profile
                      </p>
                    )}
                  </div>
                </div>
              </PrefetchLink>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <section className="mx-auto max-w-5xl space-y-6 sm:space-y-7">
        <div className="border-b border-border/24 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
                Feed
              </h1>
              <p className="text-sm text-muted-foreground">
                {orderedFeed.length} {orderedFeed.length === 1 ? "review" : "reviews"}
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

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18.5rem] xl:items-start">
          <div className="min-w-0 space-y-4">
            <div className="flex items-end justify-between border-b border-border/24 pb-4">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                {reviewsHeading}
              </h2>
              <span className="text-xs text-muted-foreground">{reviewsSubcopy}</span>
            </div>
            {reviewsSection}
          </div>

          {secondaryRail ? (
            <aside className="space-y-3.5 xl:sticky xl:top-24">
              {secondaryRail}
            </aside>
          ) : null}
        </div>
      </section>
    </HydrationBoundary>
  );
}
