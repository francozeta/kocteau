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

export type ReviewCardCopyTone = "default" | "balanced";

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
  entityMode?: "full" | "inline" | "cover";
  eyebrow?: string;
  featured?: boolean;
  bodyClampLines?: 3 | 4 | 5;
};

export type ReviewCardSlots = {
  authorName?: ReactNode;
  entity?: ReactNode;
  entityCover?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
};

export type ReviewCardEntitySummaryProps = {
  entity: ReviewCardEntity | null;
  mode: "full" | "inline" | "cover";
  interactive?: boolean;
  className?: string;
  priority?: boolean;
  tone?: ReviewCardCopyTone;
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

export function getReviewCardCopyTone(review: ReviewCardData): ReviewCardCopyTone {
  const bodyLength = review.body?.trim().length ?? 0;
  const titleLength = review.title?.trim().length ?? 0;

  if (bodyLength > 240 || titleLength > 64) {
    return "balanced";
  }

  return "default";
}

export function ReviewCardEntitySummary({
  entity,
  mode,
  interactive = false,
  className,
  priority = false,
  tone = "default",
}: ReviewCardEntitySummaryProps) {
  if (!entity) {
    return null;
  }

  if (mode === "cover") {
    return (
      <div
        className={cn(
          "min-w-0 space-y-1 text-pretty",
          className,
        )}
      >
        <p
          className={cn(
            "line-clamp-2 font-serif font-semibold tracking-normal text-foreground",
            tone === "balanced"
              ? "text-[1.12rem] leading-[1.1] sm:text-[1.28rem]"
              : "text-[1.2rem] leading-[1.08] sm:text-[1.38rem]",
          )}
        >
          {entity.title}
        </p>
        <p
          className={cn(
            "line-clamp-1 text-muted-foreground/88",
            tone === "balanced" ? "text-[13.5px] sm:text-[14px]" : "text-[14px] sm:text-[14.5px]",
          )}
        >
          {entity.artist_name ?? "Unknown artist"}
        </p>
      </div>
    );
  }

  if (mode === "inline") {
    return (
      <div
        className={cn(
          "inline-flex max-w-full items-center gap-2 rounded-lg bg-background/30 px-2.5 py-1.5 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:bg-background/24",
          interactive && "transition-colors hover:bg-muted/22 hover:text-foreground active:bg-muted/28 md:hover:bg-muted/16 md:active:bg-muted/22",
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
        "-mx-1 flex items-center gap-3 rounded-lg px-1 py-1.5",
        interactive && "transition-colors hover:bg-muted/16 active:bg-muted/22",
        className,
      )}
    >
      <EntityCoverImage
        src={entity.cover_url}
        alt={entity.title}
        sizes="44px"
        priority={priority}
        className="h-11 w-11 shrink-0 rounded-md border border-border/34 bg-muted/42 max-md:border-transparent md:border-border/28 md:bg-muted/34"
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

export function ReviewCardEntityCover({
  entity,
  className,
  priority = false,
}: {
  entity: ReviewCardEntity | null;
  className?: string;
  priority?: boolean;
}) {
  if (!entity) {
    return null;
  }

  return (
    <EntityCoverImage
      src={entity.cover_url}
      alt={entity.title}
      sizes="(max-width: 639px) 104px, (max-width: 1023px) 144px, 156px"
      priority={priority}
      quality={86}
      variant="card"
      className={cn(
        "aspect-square w-full rounded-[0.78rem] bg-muted/16 shadow-[0_12px_30px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.055)]",
        className,
      )}
      iconClassName="size-8"
    />
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
  const isCoverLedEntity = showEntity && entityMode === "cover" && entity;
  const copyTone = getReviewCardCopyTone(review);
  const usesBalancedCopy = copyTone === "balanced";

  return (
    <article
      {...articleProps}
      className={cn(
        "kocteau-review-card overflow-hidden rounded-[var(--kocteau-radius-card)]",
        featured && "kocteau-review-card-featured",
        className,
      )}
    >
      <div className="space-y-3.5 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            {eyebrow ? (
              <p className="font-editorial text-[0.98rem] font-normal italic leading-none text-muted-foreground/78">
                {eyebrow}
              </p>
            ) : null}

            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
              {showAuthor ? (
                <>
                  <UserAvatar
                    avatarUrl={author?.avatar_url}
                    displayName={author?.display_name ?? null}
                    username={author?.username ?? null}
                    size="sm"
                    sizes="24px"
                    className="size-6"
                    fallbackClassName="text-[10px]"
                  />

                  {slots?.authorName ?? (
                    <span className="text-[13px] font-medium text-foreground">{authorLabel}</span>
                  )}

                  <span className="text-muted-foreground/50">•</span>
                </>
              ) : null}

              <span>{formatDate(review.created_at)}</span>
              {review.is_pinned ? (
                <Badge variant="outline" className="h-5 rounded-md border-border/40 px-1.5 text-[10px]">
                  Pinned
                </Badge>
              ) : null}
            </div>
          </div>

          {showRatingBadge || headerActions ? (
            <div className="flex shrink-0 items-center gap-2">
              {showRatingBadge ? (
                <div className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full bg-background/38 px-2 text-[11px] font-medium tabular-nums text-foreground/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] md:bg-background/28">
                  <Star className="size-3.5 fill-current text-amber-300" />
                  {review.rating.toFixed(1)}
                </div>
              ) : null}
              {headerActions}
            </div>
          ) : null}
        </div>

        {isCoverLedEntity ? (
          <div
            className={cn(
              "grid grid-cols-[5.75rem_minmax(0,1fr)] items-start gap-3.5 sm:grid-cols-[7.25rem_minmax(0,1fr)] lg:grid-cols-[7.75rem_minmax(0,1fr)] lg:gap-4",
              featured && "grid-cols-[6.25rem_minmax(0,1fr)] sm:grid-cols-[8rem_minmax(0,1fr)] lg:grid-cols-[8.5rem_minmax(0,1fr)]",
            )}
          >
            <div className="min-w-0">
              {slots?.entityCover ?? <ReviewCardEntityCover entity={entity} priority={featured} />}
            </div>

            <div className={cn("min-w-0 self-start", usesBalancedCopy ? "space-y-2.5" : "space-y-3")}>
              {slots?.entity ?? <ReviewCardEntitySummary entity={entity} mode="cover" tone={copyTone} />}

              {hasTitle ? (
                <h3
                  className={cn(
                    "text-foreground/92",
                    usesBalancedCopy
                      ? "text-[0.9rem] font-medium leading-5 sm:text-[0.95rem]"
                      : "text-[0.94rem] font-medium leading-5 sm:text-[0.98rem]",
                  )}
                >
                  {review.title}
                </h3>
              ) : null}

              {review.body ? (
                <p
                  className={cn(
                    "font-serif text-pretty text-foreground/86",
                    usesBalancedCopy
                      ? "text-[14.5px] leading-[1.68] sm:text-[14.95px]"
                      : "text-[14.8px] leading-[1.64] sm:text-[15.1px]",
                    bodyClampLines === 3 && "line-clamp-3",
                    bodyClampLines === 4 && "line-clamp-4",
                    bodyClampLines === 5 && "line-clamp-5",
                  )}
                >
                  {review.body}
                </p>
              ) : (
                <p className="text-[14px] italic leading-6 text-muted-foreground/88">Only a rating was left for this track.</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {showEntity ? slots?.entity ?? <ReviewCardEntitySummary entity={entity} mode={entityMode} /> : null}

            {hasTitle ? (
              <h3 className="font-serif text-[1.08rem] font-semibold text-pretty text-foreground sm:text-[1.18rem]">
                {review.title}
              </h3>
            ) : null}

            {review.body ? (
              <p
                className={cn(
                  "font-serif text-[14.95px] leading-[1.64] text-pretty text-foreground/84",
                  bodyClampLines === 3 && "line-clamp-3",
                  bodyClampLines === 4 && "line-clamp-4",
                  bodyClampLines === 5 && "line-clamp-5",
                )}
              >
                {review.body}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground/88">Only a rating was left for this track.</p>
            )}
          </>
        )}

        {footer ? (
          <div
            data-prevent-review-link="true"
            className="flex items-center justify-between gap-3 pt-0.5"
          >
            {footer}
          </div>
        ) : null}
      </div>
    </article>
  );
}
