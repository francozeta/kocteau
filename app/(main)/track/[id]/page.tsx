import Image from "next/image";
import Link from "next/link";
import { Music2, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseServer } from "@/lib/supabase/server";

type EntityPage = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  type: "track" | "album";
};

type ReviewAuthor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type EntityReview = {
  id: string;
  title: string | null;
  body: string;
  rating: number;
  created_at: string;
  is_pinned: boolean;
  author: ReviewAuthor | ReviewAuthor[] | null;
};

function getAuthor(review: EntityReview) {
  if (Array.isArray(review.author)) {
    return review.author[0] ?? null;
  }

  return review.author;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
    .select("id, title, artist_name, cover_url, deezer_url, type")
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

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden py-0">
        <CardContent className="grid gap-0 p-0 md:grid-cols-[220px_1fr]">
          <div className="flex h-64 items-center justify-center bg-muted md:h-full">
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

          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{entity.type}</Badge>
              <Badge variant="outline">
                {trackReviews.length} {trackReviews.length === 1 ? "review" : "reviews"}
              </Badge>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{entity.title}</h1>
              <p className="mt-2 text-base text-muted-foreground">
                {entity.artist_name ?? "Unknown artist"}
              </p>
            </div>

            <p className="max-w-2xl text-sm text-muted-foreground">
              Esta es la página del track dentro del MVP: aquí se concentran las reviews
              publicadas por la comunidad sobre esta canción.
            </p>

            {entity.deezer_url ? (
              <Button asChild variant="outline">
                <a href={entity.deezer_url} target="_blank" rel="noreferrer">
                  Abrir en Deezer
                </a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold">Reviews del track</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mira cómo otras personas calificaron esta canción.
          </p>
        </div>
      </div>

      {trackReviews.length > 0 ? (
        <div className="space-y-4">
          {trackReviews.map((review) => {
            const author = getAuthor(review);
            const authorName = author?.display_name ?? (author ? `@${author.username}` : "Unknown user");
            const heading = review.title ?? "Review sin título";

            return (
              <Card key={review.id} className="py-0">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <div className="relative h-7 w-7 overflow-hidden rounded-full bg-muted">
                          {author?.avatar_url ? (
                            <Image
                              src={author.avatar_url}
                              alt={authorName}
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        {author ? (
                          <Link href={`/u/${author.username}`} className="font-medium text-foreground hover:underline">
                            {authorName}
                          </Link>
                        ) : (
                          <span>{authorName}</span>
                        )}
                        <span>•</span>
                        <span>{formatDate(review.created_at)}</span>
                        {review.is_pinned ? <Badge variant="outline">Pinned</Badge> : null}
                      </div>

                      <h3 className="text-lg font-semibold">{heading}</h3>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
                      <Star className="size-4 fill-current" />
                      {review.rating.toFixed(1)}
                    </div>
                  </div>

                  {review.body ? (
                    <p className="text-sm leading-6 text-foreground/85">{review.body}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Solo dejó su rating para este track.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todavía no hay reviews para este track</CardTitle>
            <CardDescription>
              Publica una y esta página empezará a sentirse viva.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}
