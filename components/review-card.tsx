"use client";

import { useRef, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Music2, Star } from "lucide-react";
import ReviewCardContextMenu from "@/components/review-card-context-menu";
import PrefetchLink from "@/components/prefetch-link";
import ReviewActionsMenu from "@/components/review-actions-menu";
import { Badge } from "@/components/ui/badge";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import ReviewBookmarkButton from "@/components/review-bookmark-button";
import ReviewCommentsButton from "@/components/review-comments-button";
import ReviewLikeButton from "@/components/review-like-button";
import { useReviewCardActions } from "@/components/review-card-actions";
import UserAvatar from "@/components/user-avatar";
import { useReviewShortcuts } from "@/hooks/use-review-shortcuts";
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
  showEntity?: boolean;
  showRatingBadge?: boolean;
  entityMode?: "full" | "inline";
  eyebrow?: string;
  featured?: boolean;
  isAuthenticated?: boolean;
  bookmarkRefreshOnToggle?: boolean;
  canManage?: boolean;
  interactive?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "a,button,[role='button'],input,textarea,select,summary,[data-prevent-review-link='true']",
    ),
  );
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
  showEntity = true,
  showRatingBadge = true,
  entityMode = "full",
  eyebrow,
  featured = false,
  isAuthenticated = false,
  bookmarkRefreshOnToggle = false,
  canManage = false,
  interactive = true,
}: ReviewCardProps) {
  const router = useRouter();
  const likeButtonRef = useRef<HTMLButtonElement | null>(null);
  const bookmarkButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasTitle = Boolean(review.title?.trim());
  const authorLabel = author?.display_name ?? (author ? `@${author.username}` : "Unknown user");
  const reviewHref = `/review/${review.id}`;
  const actions = useReviewCardActions({
    reviewId: review.id,
    reviewTitle: review.title,
    entityTitle: entity?.title ?? null,
    entityId: entity?.id ?? null,
  });
  const reviewShortcuts = useReviewShortcuts({
    enabled: interactive,
    canManage,
    canOpenTrack: actions.canOpenTrack,
    likeButtonRef,
    bookmarkButtonRef,
    onOpenReview: actions.openReview,
    onOpenTrack: actions.openTrack,
    onEditReview: actions.editReview,
    onCopyReviewLink: actions.copyReviewLink,
    onRequestDelete: actions.requestDeleteReview,
    onReportReview: actions.reportReview,
  });

  function handleOpenReview() {
    void router.prefetch(reviewHref);
    router.push(reviewHref);
  }

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    if (typeof window !== "undefined" && window.getSelection?.()?.toString()) {
      return;
    }

    if (interactive) {
      handleOpenReview();
    }
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (interactive) {
        handleOpenReview();
      }
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <article
          id={`review-${review.id}`}
          role={interactive ? "link" : undefined}
          tabIndex={interactive ? 0 : undefined}
          onClick={interactive ? handleCardClick : undefined}
          onKeyDown={interactive ? handleCardKeyDown : undefined}
          onMouseEnter={
            interactive
              ? () => {
                  reviewShortcuts.handleMouseEnter();
                  void router.prefetch(reviewHref);
                }
              : undefined
          }
          onFocusCapture={
            interactive
              ? () => {
                  reviewShortcuts.handleFocusCapture();
                  void router.prefetch(reviewHref);
                }
              : undefined
          }
          onMouseLeave={interactive ? reviewShortcuts.handleMouseLeave : undefined}
          onBlurCapture={interactive ? reviewShortcuts.handleBlurCapture : undefined}
          className={cn(
            "overflow-hidden rounded-[1.85rem] border border-border/18 bg-card/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors",
            interactive &&
              "cursor-pointer hover:bg-card/26 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
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
                {showRatingBadge ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-border/20 bg-muted/14 px-2.5 py-1 text-sm font-medium whitespace-nowrap">
                    <Star className="size-3.5 fill-current text-amber-400" />
                    {review.rating.toFixed(1)}
                  </div>
                ) : null}
                <ReviewActionsMenu
                  reviewId={review.id}
                  reviewTitle={review.title}
                  entityTitle={entity?.title ?? null}
                  entityId={entity?.id ?? null}
                  canManage={canManage}
                  onToggleBookmark={() => bookmarkButtonRef.current?.click()}
                />
              </div>
            </div>

            {showEntity ? <TrackInfo entity={entity} mode={entityMode} /> : null}

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

        <div className="flex items-center justify-between gap-3 border-t border-border/10 pt-2.5">
          <div className="flex items-center gap-0.5">
            <ReviewLikeButton
              reviewId={review.id}
              initialCount={review.likes_count}
              initialLiked={Boolean(review.viewer_has_liked)}
                  isAuthenticated={isAuthenticated}
                  buttonRef={likeButtonRef}
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
                  buttonRef={bookmarkButtonRef}
                />
              </div>
            </div>
          </div>
        </article>
      </ContextMenuTrigger>

      <ReviewCardContextMenu
        reviewId={review.id}
        reviewTitle={review.title}
        entityTitle={entity?.title ?? null}
        entityId={entity?.id ?? null}
        canManage={canManage}
        onToggleBookmark={() => bookmarkButtonRef.current?.click()}
      />
    </ContextMenu>
  );
}
