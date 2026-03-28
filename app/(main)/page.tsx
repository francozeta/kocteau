import Link from "next/link";
import { ArrowRight, Dot, Music2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import ReviewCard from "@/components/review-card";
import { createPageMetadata } from "@/lib/metadata";
import {
  getFeedPublicBundle,
  getFeedViewerState,
  type FeedReview,
} from "@/lib/queries/feed";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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

export const metadata = createPageMetadata({
  title: "Feed",
  description: "Latest music reviews, ratings, and notes from the Kocteau feed.",
  path: "/",
});

export default async function HomePage() {
  const supabase = await supabaseServer();
  const [auth, { feed, recentTracks }] = await Promise.all([
    supabase.auth.getUser(),
    getFeedPublicBundle(),
  ]);
  const {
    data: { user },
  } = auth;
  const { likedReviewIds, bookmarkedReviewIds } = await getFeedViewerState(
    user?.id,
    feed.map((review) => review.id),
  );

  return (
    <section className="mx-auto max-w-3xl space-y-6 sm:space-y-7">
      <div className="border-b border-border/30 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
              Feed
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{feed.length}</span>
              <span>{feed.length === 1 ? "review" : "reviews"}</span>
              <Dot className="size-4" />
              <span className="font-medium text-foreground">{recentTracks.length}</span>
              <span>{recentTracks.length === 1 ? "track" : "tracks"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 text-sm">
            <Link
              href="/search"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full border-border/30")}
            >
              Search
            </Link>
            <Link
              href="/track"
              className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "rounded-full")}
            >
              Tracks
            </Link>
          </div>
        </div>
      </div>

      {recentTracks.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Active tracks
            </p>
            <Link
              href="/track"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recentTracks.map((track) => (
              <Link
                key={track.entityId}
                href={`/track/${track.entityId}`}
                className="group flex items-center gap-3 rounded-[1.45rem] border border-border/20 bg-card/20 px-3 py-3 transition-colors hover:bg-card/35"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
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
                  <p className="line-clamp-1 text-sm font-medium text-foreground">
                    {track.title}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {track.artistName ?? "Unknown artist"}
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-end justify-between border-b border-border/30 pb-4">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Latest
        </h2>
        <p className="text-sm text-muted-foreground">
          {feed.length} {feed.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      {feed.length > 0 ? (
        <div className="space-y-4">
          {feed.map((review) => {
            const entity = getEntity(review);
            const author = getAuthor(review);

            return (
              <ReviewCard
                key={review.id}
                review={{
                  ...review,
                  viewer_has_liked: likedReviewIds.has(review.id),
                  viewer_has_bookmarked: bookmarkedReviewIds.has(review.id),
                }}
                entity={entity}
                author={author}
                showAuthor={true}
                entityMode="full"
                isAuthenticated={Boolean(user)}
              />
            );
          })}
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
      )}
    </section>
  );
}
