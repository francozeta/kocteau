import Link from "next/link";
import { MessageSquarePlus, Music2, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewCard, { type ReviewCardAuthor, type ReviewCardData } from "@/components/review-card";
import { cn } from "@/lib/utils";
import { supabaseServer } from "@/lib/supabase/server";

type EntityPage = {
  id: string;
  provider: string;
  provider_id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  type: "track" | "album";
};

type EntityReview = {
  id: ReviewCardData["id"];
  title: ReviewCardData["title"];
  body: ReviewCardData["body"];
  rating: ReviewCardData["rating"];
  created_at: ReviewCardData["created_at"];
  is_pinned: boolean;
  author: ReviewCardAuthor | ReviewCardAuthor[] | null;
};

function getAuthor(review: EntityReview) {
  if (Array.isArray(review.author)) {
    return review.author[0] ?? null;
  }

  return review.author;
}
export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .select("id, provider, provider_id, title, artist_name, cover_url, deezer_url, type")
    .eq("id", id)
    .single<EntityPage>();

  if (entityError || !entity) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      title,
      body,
      rating,
      created_at,
      is_pinned,
      author:profiles!reviews_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("entity_id", entity.id)
    .order("created_at", { ascending: false });

  const trackReviews = (reviews ?? []) as EntityReview[];
  const averageRating =
    trackReviews.length > 0
      ? trackReviews.reduce((sum, review) => sum + review.rating, 0) / trackReviews.length
      : null;
  const composeParams = new URLSearchParams({
    compose: "1",
    reviewQuery: [entity.title, entity.artist_name].filter(Boolean).join(" "),
    composeProvider: entity.provider,
    composeProviderId: entity.provider_id,
    composeTitle: entity.title,
  });

  if (entity.artist_name) {
    composeParams.set("composeArtist", entity.artist_name);
  }

  if (entity.cover_url) {
    composeParams.set("composeCover", entity.cover_url);
  }

  if (entity.deezer_url) {
    composeParams.set("composeDeezer", entity.deezer_url);
  }

  return (
    <section className="space-y-8">
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-muted/50 via-background to-background py-0 shadow-sm">
        <CardContent className="grid gap-0 p-0 xl:grid-cols-[260px_minmax(0,1fr)_240px]">
          <div className="flex h-72 items-center justify-center bg-muted xl:h-full">
            {entity.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entity.cover_url}
                alt={entity.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Music2 className="size-10 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Track page</Badge>
              <Badge variant="outline">{entity.type}</Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-balance">
                {entity.title}
              </h1>
              <p className="text-base text-muted-foreground">
                {entity.artist_name ?? "Unknown artist"}
              </p>
            </div>

            <p className="max-w-2xl text-sm text-muted-foreground">
              This is where a single song gathers conversation: rating, context and
              personal tone, all around the same track.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/track/${entity.id}?${composeParams.toString()}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                <MessageSquarePlus className="size-4" />
                Write review
              </Link>

              {entity.deezer_url ? (
                <a
                  href={entity.deezer_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Open in Deezer
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 border-t border-border/50 p-6 xl:border-t-0 xl:border-l xl:border-border/50">
            <div className="rounded-xl border border-border/50 bg-background/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Reviews
              </p>
              <p className="mt-2 text-3xl font-semibold">{trackReviews.length}</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Average
              </p>
              <div className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold">
                <Star className="size-5 fill-current text-amber-400" />
                {averageRating ? averageRating.toFixed(1) : "N/A"}
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Canonical ID
              </p>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{entity.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="text-xl font-semibold">Track reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            First the track, then the review angle, and finally the note.
          </p>
        </div>
      </div>

      {trackReviews.length > 0 ? (
        <div className="space-y-4">
          {trackReviews.map((review) => {
            const author = getAuthor(review);

            return (
              <ReviewCard
                key={review.id}
                review={review}
                entity={entity}
                author={author}
                showAuthor={true}
                entityMode="inline"
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>There are no reviews for this track yet</CardTitle>
            <CardDescription>
              Start the conversation with the first review from the button above.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}
