import Image from "next/image";
import Link from "next/link";
import { Music2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseServer } from "@/lib/supabase/server";

type FeedEntity = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
};

type FeedAuthor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type FeedReview = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  created_at: string;
  entities: FeedEntity | FeedEntity[] | null;
  author: FeedAuthor | FeedAuthor[] | null;
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function HomePage() {
  const supabase = await supabaseServer();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      title,
      body,
      rating,
      created_at,
      entities (
        id,
        title,
        artist_name,
        cover_url
      ),
      author:profiles!reviews_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })
    .limit(24);

  const feed = (reviews ?? []) as FeedReview[];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">Demo feed</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Latest reviews</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Kocteau empieza aquí: gente calificando tracks, dejando una nota opcional y
              descubriendo música a través de otras personas.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {feed.length} {feed.length === 1 ? "review reciente" : "reviews recientes"}
        </p>
      </div>

      {feed.length > 0 ? (
        <div className="space-y-4">
          {feed.map((review) => {
            const entity = getEntity(review);
            const author = getAuthor(review);
            const authorName = author?.display_name ?? (author ? `@${author.username}` : "Unknown user");
            const heading = review.title ?? entity?.title ?? "Untitled review";

            return (
              <Card key={review.id} className="overflow-hidden py-0">
                <CardContent className="grid gap-0 p-0 sm:grid-cols-[112px_1fr]">
                  <div className="flex h-32 items-center justify-center bg-muted sm:h-full sm:w-28">
                    {entity?.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entity.cover_url}
                        alt={entity.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Music2 className="size-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                        </div>

                        <div>
                          {entity ? (
                            <Link href={`/track/${entity.id}`} className="hover:underline">
                              <h2 className="text-lg font-semibold">{heading}</h2>
                            </Link>
                          ) : (
                            <h2 className="text-lg font-semibold">{heading}</h2>
                          )}
                          {entity ? (
                            <Link
                              href={`/track/${entity.id}`}
                              className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
                            >
                              {entity.title}
                              {entity.artist_name ? ` • ${entity.artist_name}` : ""}
                            </Link>
                          ) : null}
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
                        <Star className="size-4 fill-current" />
                        {review.rating.toFixed(1)}
                      </div>
                    </div>

                    {review.body ? (
                      <p className="max-w-3xl text-sm leading-6 text-foreground/85">{review.body}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        Solo dejó su rating para este track.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todavía no hay reviews</CardTitle>
            <CardDescription>
              Publica la primera desde el botón de arriba y aparecerá aquí automáticamente.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}
