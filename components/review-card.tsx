import { Music2, Star } from "lucide-react";
import PrefetchLink from "@/components/prefetch-link";
import ReviewCardActionsMenu from "@/components/review-card-actions-menu";
import { Badge } from "@/components/ui/badge";
import ReviewBookmarkButton from "@/components/review-bookmark-button";
import ReviewCommentsButton from "@/components/review-comments-button";
import ReviewLikeButton from "@/components/review-like-button";
import UserAvatar from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export type ReviewCardEntity = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
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

type ReviewCardProps = {
  review: ReviewCardData;
  entity: ReviewCardEntity | null;
  author?: ReviewCardAuthor | null;
  showAuthor?: boolean;
  entityMode?: "full" | "inline";
  eyebrow?: string;
  featured?: boolean;
  isAuthenticated?: boolean;
  bookmarkRefreshOnToggle?: boolean;
  canManage?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
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
      <PrefetchLink
        href={`/track/${entity.id}`}
        className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/20 bg-muted/18 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/28 hover:text-foreground"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {entity.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entity.cover_url}
              alt={entity.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Music2 className="size-3 text-muted-foreground" />
          )}
        </div>
        <span className="truncate font-medium text-foreground">{entity.title}</span>
        <span className="truncate text-muted-foreground/70">
          {entity.artist_name ?? "Unknown artist"}
        </span>
      </PrefetchLink>
    );
  }

  return (
    <PrefetchLink
      href={`/track/${entity.id}`}
      className="group/track flex items-center gap-3 rounded-[1.35rem] border border-border/18 bg-muted/16 px-3 py-3 transition-colors hover:bg-muted/26"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-muted">
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
        <p className="line-clamp-1 font-medium text-foreground">
          {entity.title}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {entity.artist_name ?? "Unknown artist"}
        </p>
      </div>
    </PrefetchLink>
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
  isAuthenticated = false,
  bookmarkRefreshOnToggle = false,
  canManage = false,
}: ReviewCardProps) {
  const hasTitle = Boolean(review.title?.trim());
  const authorLabel = author?.display_name ?? (author ? `@${author.username}` : "Unknown user");

  return (
    <article
      id={`review-${review.id}`}
      className={cn(
        "overflow-hidden rounded-[1.85rem] border border-border/18 bg-card/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-card/26",
        featured && "border-border/30 bg-card/22",
      )}
    >
      <div className="space-y-4 p-4 sm:p-5">
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

                  {author ? (
                    <PrefetchLink
                      href={`/u/${author.username}`}
                      className="text-xs font-medium text-foreground transition-colors hover:underline sm:text-sm"
                    >
                      {authorLabel}
                    </PrefetchLink>
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/20 bg-muted/14 px-2.5 py-1 text-sm font-medium whitespace-nowrap">
              <Star className="size-3.5 fill-current text-amber-400" />
              {review.rating.toFixed(1)}
            </div>
            <ReviewCardActionsMenu
              reviewId={review.id}
              reviewTitle={review.title}
              entityTitle={entity?.title ?? null}
              canManage={canManage}
            />
          </div>
        </div>

        <TrackInfo entity={entity} mode={entityMode} />

        {hasTitle ? (
          <h3 className="font-serif text-[1.08rem] font-semibold tracking-tight text-foreground sm:text-[1.15rem]">
            {review.title}
          </h3>
        ) : null}

        {review.body ? (
          <p className="text-[15px] leading-7 text-foreground/82">{review.body}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Only a rating was left for this track.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border/14 pt-3">
          <div className="flex items-center gap-1">
            <ReviewLikeButton
              reviewId={review.id}
              initialCount={review.likes_count}
              initialLiked={Boolean(review.viewer_has_liked)}
              isAuthenticated={isAuthenticated}
            />
            <ReviewCommentsButton
              reviewId={review.id}
              initialCount={review.comments_count}
              isAuthenticated={isAuthenticated}
            />
            <ReviewBookmarkButton
              reviewId={review.id}
              initialBookmarked={Boolean(review.viewer_has_bookmarked)}
              isAuthenticated={isAuthenticated}
              refreshOnToggle={bookmarkRefreshOnToggle}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
