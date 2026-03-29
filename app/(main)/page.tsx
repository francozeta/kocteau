import Link from "next/link";
import { ArrowRight, Music2, Search, SlidersHorizontal } from "lucide-react";
import PrefetchLink from "@/components/prefetch-link";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import ReviewCard from "@/components/review-card";
import TrackContextMenu from "@/components/track-context-menu";
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
    <section className="mx-auto max-w-3xl space-y-7 sm:space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/24 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/24 bg-card/18 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <Music2 className="size-3.5" />
            Discovery
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/18 bg-muted/12 px-3 py-1.5 text-sm text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            Latest reviews
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/search"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "rounded-full border-border/26 bg-card/12 text-foreground hover:bg-card/22",
            )}
          >
            <Search className="size-4" />
            Search
          </Link>
          <Link
            href="/track"
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "rounded-full text-muted-foreground hover:text-foreground",
            )}
          >
            Tracks
          </Link>
        </div>
      </div>

      {recentTracks.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Now in rotation
              </p>
              <p className="text-sm text-muted-foreground">
                Tracks shaping the latest notes in Kocteau.
              </p>
            </div>
            <Link
              href="/track"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recentTracks.map((track) => (
              <TrackContextMenu
                key={track.entityId}
                href={`/track/${track.entityId}`}
                title={track.title}
                artistName={track.artistName}
              >
                <PrefetchLink
                  href={`/track/${track.entityId}`}
                  className="group flex items-center gap-3 rounded-[1.55rem] border border-border/20 bg-card/18 px-3 py-3 transition-colors hover:border-border/28 hover:bg-card/30"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-muted">
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
                    <p className="line-clamp-1 text-[15px] font-medium text-foreground">
                      {track.title}
                    </p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {track.artistName ?? "Unknown artist"}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </PrefetchLink>
              </TrackContextMenu>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-b border-border/24 pb-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Latest reviews
        </h2>
        <span className="text-xs text-muted-foreground">
          Sorted by newest
        </span>
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
                canManage={Boolean(user?.id && author?.id === user.id)}
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
