import Link from "next/link";
import { ArrowRight, Music2, Star } from "lucide-react";
import PrefetchLink from "@/components/prefetch-link";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FeedReviewCard } from "@/components/review-route-cards";
import TrackContextMenu from "@/components/track-context-menu";
import { createPageMetadata } from "@/lib/metadata";
import {
  getFeedPublicBundle,
  getFeedViewerState,
  type FeedReview,
} from "@/lib/queries/feed";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type FeedView = "discovery" | "latest" | "top-rated";

const feedViews: Array<{
  value: FeedView;
  label: string;
}> = [
  {
    value: "latest",
    label: "Latest Reviews",
  },
  {
    value: "discovery",
    label: "Discovery",
  },
  {
    value: "top-rated",
    label: "Top Rated",
  },
];

function isFeedView(value: string | undefined): value is FeedView {
  return value === "discovery" || value === "latest" || value === "top-rated";
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

  const supabase = await supabaseServer();
  const [auth, { feed, recentTracks }] = await Promise.all([
    supabase.auth.getUser(),
    getFeedPublicBundle(),
  ]);
  const {
    data: { user },
  } = auth;
  const orderedFeed = sortFeed(feed, activeView);
  const { likedReviewIds, bookmarkedReviewIds } = await getFeedViewerState(
    user?.id,
    orderedFeed.map((review) => review.id),
  );

  const discoveryRail = recentTracks.slice(0, activeView === "discovery" ? 6 : 4);
  const shouldLeadWithReviews = activeView !== "discovery";

  const reviewsSection = orderedFeed.length > 0 ? (
    <div className="space-y-4">
      <div className="space-y-4">
        {orderedFeed.map((review, index) => {
          const entity = getEntity(review);
          const author = getAuthor(review);

          return (
            <FeedReviewCard
              key={review.id}
              review={{
                ...review,
                viewer_has_liked: likedReviewIds.has(review.id),
                viewer_has_bookmarked: bookmarkedReviewIds.has(review.id),
              }}
              entity={entity}
              author={author}
              featured={shouldLeadWithReviews && index === 0}
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

  const discoverySection = discoveryRail.length > 0 ? (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Now in rotation
        </p>
        <Link
          href="/track"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {discoveryRail.map((track) => {
          const composeParams = new URLSearchParams();

          if (activeView !== "latest") {
            composeParams.set("view", activeView);
          }

          composeParams.set("compose", "1");
          composeParams.set(
            "reviewQuery",
            [track.title, track.artistName].filter(Boolean).join(" "),
          );

          const composeHref = `/?${composeParams.toString()}`;

          return (
            <TrackContextMenu
              key={track.entityId}
              href={`/track/${track.entityId}`}
              title={track.title}
              artistName={track.artistName}
              composeHref={composeHref}
            >
              <div className="rounded-[1.35rem] border border-border/18 bg-card/16 p-2.5">
                <PrefetchLink
                  href={`/track/${track.entityId}`}
                  className="group flex items-center gap-3 rounded-[1.2rem] transition-colors hover:text-foreground"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[0.95rem] bg-muted">
                    {track.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Music2 className="size-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-serif text-[15px] font-medium text-foreground">
                      {track.title}
                    </p>
                    <p className="line-clamp-1 text-[13.5px] font-medium text-muted-foreground">
                      {track.artistName ?? "Unknown artist"}
                    </p>
                  </div>

                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </PrefetchLink>

                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/12 pt-2.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {track.averageRating ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/18 bg-muted/16 px-2 py-1 font-medium text-foreground">
                        <Star className="size-3 fill-current text-amber-400" />
                        {track.averageRating.toFixed(1)}
                      </span>
                    ) : null}
                    <span>
                      {track.reviewCount} {track.reviewCount === 1 ? "review" : "reviews"}
                    </span>
                  </div>

                  <Link
                    href={composeHref}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "ghost" }),
                      "h-8 rounded-full px-3 text-xs text-foreground hover:bg-muted/28",
                    )}
                  >
                    Write review
                  </Link>
                </div>
              </div>
            </TrackContextMenu>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <section className="mx-auto max-w-3xl space-y-6 sm:space-y-7">
      <div className="border-b border-border/24 pb-4">
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

      {shouldLeadWithReviews ? reviewsSection : null}
      {discoverySection}
      {shouldLeadWithReviews ? null : reviewsSection}
    </section>
  );
}
