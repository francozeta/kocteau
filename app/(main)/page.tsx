import Link from "next/link";
import { ArrowRight, Compass, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewCard, { type ReviewCardAuthor, type ReviewCardData, type ReviewCardEntity } from "@/components/review-card";
import { getViewerBookmarkedReviewIds } from "@/lib/queries/review-bookmarks";
import { getRecentlyDiscussedTracks } from "@/lib/queries/discovery";
import { getViewerLikedReviewIds, runReviewListQuery } from "@/lib/queries/review-likes";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type FeedReview = {
  id: ReviewCardData["id"];
  title: ReviewCardData["title"];
  body: ReviewCardData["body"];
  rating: ReviewCardData["rating"];
  likes_count: ReviewCardData["likes_count"];
  comments_count: ReviewCardData["comments_count"];
  created_at: ReviewCardData["created_at"];
  entities: ReviewCardEntity | ReviewCardEntity[] | null;
  author: ReviewCardAuthor | ReviewCardAuthor[] | null;
};

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

export default async function HomePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const feed = await runReviewListQuery<FeedReview>(async (mode) =>
    supabase
      .from("reviews")
      .select([
        "id",
        "title",
        "body",
        "rating",
        ...(mode !== "base" ? ["likes_count"] : []),
        ...(mode === "all" ? ["comments_count"] : []),
        "created_at",
        `entities (
          id,
          title,
          artist_name,
          cover_url
        )`,
        `author:profiles!reviews_author_id_fkey (
          username,
          display_name,
          avatar_url
        )`,
      ].join(","))
      .order("created_at", { ascending: false })
      .limit(24),
  );
  const likedReviewIds = await getViewerLikedReviewIds(
    supabase,
    user?.id,
    feed.map((review) => review.id),
  );
  const bookmarkedReviewIds = await getViewerBookmarkedReviewIds(
    supabase,
    user?.id,
    feed.map((review) => review.id),
  );
  const recentTracks = await getRecentlyDiscussedTracks(4);

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-muted/60 via-background to-background py-0 shadow-sm">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-3">
              <Badge variant="secondary" className="gap-1.5">
                <Compass className="size-3.5" />
                Demo feed
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  Short reviews, specific tracks, and social discovery.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Kocteau starts here: someone finds a song, rates it, leaves a note,
                  and opens a new door for everyone else.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/search" className={cn(buttonVariants({ size: "sm" }))}>
                Search music
              </Link>
              <Link href="/track" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                View track pages
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-background/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Reviews
                </p>
                <p className="mt-2 text-2xl font-semibold">{feed.length}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Tracks
                </p>
                <p className="mt-2 text-2xl font-semibold">{recentTracks.length}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Loop
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Search, review, share.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70 py-0 shadow-sm">
          <CardHeader className="border-b border-border/50 py-6">
            <CardTitle>Recent track pages</CardTitle>
            <CardDescription>
              What is already starting conversations inside the product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {recentTracks.length > 0 ? (
              recentTracks.map((track) => (
                <Link
                  key={track.entityId}
                  href={`/track/${track.entityId}`}
                  className="flex items-center gap-3 rounded-xl border border-border/50 p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
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
                    <p className="line-clamp-1 font-medium">{track.title}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {track.artistName ?? "Unknown artist"}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                There are no published track pages yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-end justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Latest reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The feed shows the track first, then the review angle, and finally the note.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {feed.length} {feed.length === 1 ? "recent review" : "recent reviews"}
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
        <Card>
          <CardHeader>
            <CardTitle>There are no reviews yet</CardTitle>
            <CardDescription>
              Publish the first one from the button above and it will appear here automatically.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}
