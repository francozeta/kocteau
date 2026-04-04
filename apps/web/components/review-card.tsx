import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EntityCoverImage from "@/components/entity-cover-image";
import UserAvatar from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export type ReviewCardEntity = {
  id: string;
  provider?: string;
  provider_id?: string;
  type?: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url?: string | null;
};

export type ReviewCardAuthor = {
  id?: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ReviewCardData = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_pinned?: boolean;
  viewer_has_liked?: boolean;
  viewer_has_bookmarked?: boolean;
};

export type ReviewCardDisplayOptions = {
  showAuthor?: boolean;
  showEntity?: boolean;
  showRatingBadge?: boolean;
  entityMode?: "full" | "inline";
  eyebrow?: string;
  featured?: boolean;
  bodyClampLines?: 3 | 4 | 5;
};

export type ReviewCardSlots = {
  authorName?: ReactNode;
  entity?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
};

export type ReviewCardEntitySummaryProps = {
  entity: ReviewCardEntity | null;
  mode: "full" | "inline";
  interactive?: boolean;
  className?: string;
  priority?: boolean;
};

type ReviewCardProps = {
  review: ReviewCardData;
  entity: ReviewCardEntity | null;
  author?: ReviewCardAuthor | null;
  display?: ReviewCardDisplayOptions;
  slots?: ReviewCardSlots;
  rootProps?: ComponentPropsWithoutRef<"article">;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAuthorLabel(author: ReviewCardAuthor | null | undefined) {
  return author?.display_name ?? (author ? `@${author.username}` : "Unknown user");
}

export function ReviewCardEntitySummary({
  entity,
  mode,
  interactive = false,
  className,
  priority = false,
}: ReviewCardEntitySummaryProps) {
  if (!entity) {
    return null;
  }

  if (mode === "inline") {
    return (
      <div
        className={cn(
          "inline-flex max-w-full items-center gap-2 rounded-full border border-border/28 bg-card/16 px-2.5 py-1.5 text-sm text-muted-foreground md:border-border/18 md:bg-transparent",
          interactive && "transition-colors hover:bg-muted/26 hover:text-foreground active:bg-muted/32 md:hover:bg-muted/18 md:active:bg-muted/24",
          className,
        )}
      >
        <EntityCoverImage
          src={entity.cover_url}
          alt={entity.title}
          sizes="24px"
          priority={priority}
          quality={56}
          className="h-6 w-6 shrink-0 rounded-full bg-muted"
          iconClassName="size-3"
        />
        <span className="truncate font-serif text-[15px] font-medium text-foreground">{entity.title}</span>
        <span className="truncate text-muted-foreground/70">{entity.artist_name ?? "Unknown artist"}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "-mx-1 flex items-center gap-3 rounded-[1.15rem] px-1 py-1.5",
        interactive && "transition-colors hover:bg-muted/16 active:bg-muted/22",
        className,
      )}
    >
      <EntityCoverImage
        src={entity.cover_url}
        alt={entity.title}
        sizes="44px"
        priority={priority}
        className="h-11 w-11 shrink-0 rounded-[0.95rem] border border-border/24 bg-muted/28 md:border-border/14 md:bg-muted/18"
        iconClassName="size-4"
      />

      <div className="min-w-0 space-y-0.5">
        <p className="line-clamp-1 font-serif text-[1rem] font-medium text-foreground">{entity.title}</p>
        <p className="line-clamp-1 text-[13px] text-muted-foreground">
          {entity.artist_name ?? "Unknown artist"}
        </p>
      </div>
    </div>
  );
}

export default function ReviewCard({
  review,
  entity,
  author = null,
  display,
  slots,
  rootProps,
}: ReviewCardProps) {
  const {
    showAuthor = true,
    showEntity = true,
    showRatingBadge = true,
    entityMode = "full",
    eyebrow,
    featured = false,
    bodyClampLines,
  } = display ?? {};
  const { className, ...articleProps } = rootProps ?? {};
  const hasTitle = Boolean(review.title?.trim());
  const authorLabel = getAuthorLabel(author);
  const headerActions = slots?.headerActions;
  const footer = slots?.footer;

  return (
    <article
      {...articleProps}
      className={cn(
        "overflow-hidden rounded-[1.65rem] border border-border/28 bg-card/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors md:border-border/18 md:bg-card/14",
        featured && "border-border/34 bg-card/28 md:border-border/24 md:bg-card/18",
        className,
      )}
    >
      <div className="space-y-4 p-4 sm:p-[1.125rem]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {showAuthor ? (
                <>
                  <UserAvatar
                    avatarUrl={author?.avatar_url}
                    displayName={author?.display_name ?? null}
                    username={author?.username ?? null}
                    size="sm"
                    className="size-6"
                    fallbackClassName="text-[10px]"
                  />

                  {slots?.authorName ?? (
                    <span className="text-xs font-medium text-foreground sm:text-sm">{authorLabel}</span>
                  )}

                  <span className="text-muted-foreground/50">•</span>
                </>
              ) : null}

              <span className="text-xs sm:text-sm">{formatDate(review.created_at)}</span>
              {review.is_pinned ? (
                <Badge variant="outline" className="text-xs">
                  Pinned
                </Badge>
              ) : null}
            </div>
          </div>

          {showRatingBadge || headerActions ? (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {showRatingBadge ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-muted/24 px-2.5 py-1 text-sm font-medium whitespace-nowrap md:border-border/20 md:bg-muted/14">
                  <Star className="size-3.5 fill-current text-amber-400" />
                  {review.rating.toFixed(1)}
                </div>
              ) : null}
              {headerActions}
            </div>
          ) : null}
        </div>

        {showEntity ? slots?.entity ?? <ReviewCardEntitySummary entity={entity} mode={entityMode} /> : null}

        {hasTitle ? (
          <h3 className="font-serif text-[1.15rem] font-semibold tracking-tight text-foreground sm:text-[1.22rem]">
            {review.title}
          </h3>
        ) : null}

        {review.body ? (
          <p
            className={cn(
              "font-serif text-[15.5px] leading-[1.6] text-foreground/86",
              bodyClampLines === 3 && "line-clamp-3",
              bodyClampLines === 4 && "line-clamp-4",
              bodyClampLines === 5 && "line-clamp-5",
            )}
          >
            {review.body}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Only a rating was left for this track.</p>
        )}

        {footer ? (
          <div
            data-prevent-review-link="true"
            className="flex items-center justify-between gap-3 border-t border-border/18 pt-2.5 md:border-border/10"
          >
            {footer}
          </div>
        ) : null}
      </div>
    </article>
  );
}
