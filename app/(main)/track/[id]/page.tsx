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
    <section className="space-y-10">
      <div className="overflow-hidden rounded-lg border border-border/30 bg-card/50">
        <div className="flex items-start gap-4 p-4 sm:gap-6 sm:p-6">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-32">
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

          <div className="min-w-0 flex-1 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs border-border/30">{entity.type}</Badge>
              </div>

              <div className="space-y-2">
                <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-balance leading-tight">
                  {entity.title}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  {entity.artist_name ?? "Unknown artist"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/track/${entity.id}?${composeParams.toString()}`}
                className={cn(buttonVariants({ size: "sm" }), "bg-foreground text-background hover:bg-foreground/90 gap-2")}
              >
                <MessageSquarePlus className="size-4" />
                Add review
              </Link>

              {entity.deezer_url ? (
                <a
                  href={entity.deezer_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-border/30")}
                >
                  Open in Deezer
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/30 bg-card/50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Reviews
          </p>
          <p className="mt-3 text-3xl font-bold">{trackReviews.length}</p>
        </div>

        <div className="rounded-lg border border-border/30 bg-card/50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Average rating
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-2xl font-bold">
            <Star className="size-5 fill-current text-amber-400" />
            {averageRating ? averageRating.toFixed(1) : "—"}
          </div>
        </div>

        <div className="rounded-lg border border-border/30 bg-card/50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Track ID
          </p>
          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground font-mono">{entity.id}</p>
        </div>
      </div>

      <div className="border-t border-border/30 pt-8">
        <h2 className="font-serif text-2xl font-bold mb-2">Reviews</h2>
        {trackReviews.length > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            {trackReviews.length} {trackReviews.length === 1 ? "review" : "reviews"}
          </p>
        )}

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
          <div className="py-8 text-center text-sm text-muted-foreground">
            No reviews yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </section>
  );
}
