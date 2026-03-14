import Image from "next/image";
import Link from "next/link";
import { Music2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type ReviewCardEntity = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
};

export type ReviewCardAuthor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ReviewCardData = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  created_at: string;
  is_pinned?: boolean;
};

type ReviewCardProps = {
  review: ReviewCardData;
  entity: ReviewCardEntity | null;
  author?: ReviewCardAuthor | null;
  showAuthor?: boolean;
  entityMode?: "full" | "inline";
  eyebrow?: string;
  featured?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TrackInfo({
  entity,
  mode,
}: {
  entity: ReviewCardEntity | null;
  mode: "full" | "inline";
}) {
  if (!entity) {
    return null;
  }

  if (mode === "inline") {
    return (
      <Link
        href={`/track/${entity.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Music2 className="size-4" />
        <span className="font-medium text-foreground">{entity.title}</span>
        <span className="text-muted-foreground/70">
          {entity.artist_name ?? "Unknown artist"}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/track/${entity.id}`}
      className="group/track flex items-center gap-3 rounded-lg border border-border/30 bg-muted/30 p-3 transition-all hover:border-border/60 hover:bg-muted/50"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {entity.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entity.cover_url}
            alt={entity.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Music2 className="size-4 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Track
        </p>
        <p className="line-clamp-1 font-medium text-foreground group-hover/track:underline">
          {entity.title}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {entity.artist_name ?? "Unknown artist"}
        </p>
      </div>
    </Link>
  );
}

export default function ReviewCard({
  review,
  entity,
  author = null,
  showAuthor = true,
  entityMode = "full",
  eyebrow,
  featured = false,
}: ReviewCardProps) {
  const hasTitle = Boolean(review.title?.trim());
  const authorLabel = author?.display_name ?? (author ? `@${author.username}` : "Unknown user");

  return (
    <Card
      className={`overflow-hidden border-border/30 bg-card/60 py-0 shadow-none backdrop-blur-sm hover:border-border/60 transition-colors ${
        featured ? "ring-1 ring-border/50" : ""
      }`}
    >
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2.5">
            {eyebrow ? (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {showAuthor ? (
                <>
                  <div className="relative h-6 w-6 overflow-hidden rounded-full bg-muted border border-border/30">
                    {author?.avatar_url ? (
                      <Image
                        src={author.avatar_url}
                        alt={authorLabel}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  {author ? (
                    <Link
                      href={`/u/${author.username}`}
                      className="font-medium text-foreground transition-colors hover:underline text-xs sm:text-sm"
                    >
                      {authorLabel}
                    </Link>
                  ) : (
                    <span className="text-xs sm:text-sm">Unknown user</span>
                  )}

                  <span className="text-muted-foreground/50">•</span>
                </>
              ) : null}

              <span className="text-xs sm:text-sm">{formatDate(review.created_at)}</span>
              {review.is_pinned ? <Badge variant="outline" className="text-xs">Pinned</Badge> : null}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-muted/30 px-3 py-1 text-sm font-medium whitespace-nowrap">
            <Star className="size-4 fill-current text-amber-400" />
            {review.rating.toFixed(1)}
          </div>
        </div>

        <TrackInfo entity={entity} mode={entityMode} />

        {hasTitle ? (
          <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
            {review.title}
          </h3>
        ) : null}

        {review.body ? (
          <p className="text-sm leading-relaxed text-foreground/80">{review.body}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Only a rating was left for this track.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
