"use client";

import { useRef, type ComponentPropsWithoutRef, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import ReviewCard, {
  ReviewCardEntitySummary,
  type ReviewCardAuthor,
  type ReviewCardData,
  type ReviewCardDisplayOptions,
  type ReviewCardEntity,
} from "@/components/review-card";
import ReviewActionsMenu from "@/components/review-actions-menu";
import ReviewCardContextMenu from "@/components/review-card-context-menu";
import ReviewCardInteractionBar from "@/components/review-card-interaction-bar";
import PrefetchLink from "@/components/prefetch-link";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

export type ReviewCardBehaviorOptions = {
  interactive?: boolean;
  showHeaderActions?: boolean;
  showInteractionBar?: boolean;
  showContextMenu?: boolean;
};

export type ReviewCardPermissions = {
  isAuthenticated?: boolean;
  canManage?: boolean;
};

type RoutedReviewCardProps = {
  review: ReviewCardData;
  entity: ReviewCardEntity | null;
  author?: ReviewCardAuthor | null;
  display?: ReviewCardDisplayOptions;
  behavior?: ReviewCardBehaviorOptions;
  permissions?: ReviewCardPermissions;
};

type ReviewCardRouteProps = {
  review: ReviewCardData;
  entity: ReviewCardEntity | null;
  author?: ReviewCardAuthor | null;
  isAuthenticated?: boolean;
  canManage?: boolean;
};

type FeedReviewCardProps = ReviewCardRouteProps & {
  featured?: boolean;
};

type ProfileReviewCardProps = ReviewCardRouteProps & {
  featured?: boolean;
};

function buildFeedReviewCardDisplay(
  featured = false,
): ReviewCardDisplayOptions {
  return {
    featured,
    bodyClampLines: 4,
  };
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

function getAuthorLabel(author: ReviewCardAuthor | null | undefined) {
  return author?.display_name ?? (author ? `@${author.username}` : "Unknown user");
}

function LinkedAuthorName({ author }: { author: ReviewCardAuthor | null | undefined }) {
  if (!author) {
    return null;
  }

  return (
    <PrefetchLink
      href={`/u/${author.username}`}
      data-prevent-review-link="true"
      className="text-xs font-medium text-foreground transition-colors hover:underline sm:text-sm"
    >
      {getAuthorLabel(author)}
    </PrefetchLink>
  );
}

function LinkedEntitySummary({
  entity,
  mode,
}: {
  entity: ReviewCardEntity | null;
  mode: "full" | "inline";
}) {
  if (!entity) {
    return null;
  }

  return (
    <div data-prevent-review-link="true">
      <PrefetchLink
        href={`/track/${entity.id}`}
        queryWarmup={{ kind: "track", id: entity.id }}
        className="block"
      >
        <ReviewCardEntitySummary entity={entity} mode={mode} interactive />
      </PrefetchLink>
    </div>
  );
}

function RoutedReviewCard({
  review,
  entity,
  author = null,
  display,
  behavior,
  permissions,
}: RoutedReviewCardProps) {
  const router = useRouter();
  const bookmarkButtonRef = useRef<HTMLButtonElement | null>(null);
  const reviewHref = `/review/${review.id}`;
  const { entityMode = "full" } = display ?? {};
  const {
    interactive = true,
    showHeaderActions = true,
    showInteractionBar = true,
    showContextMenu = true,
  } = behavior ?? {};
  const { isAuthenticated = false, canManage = false } = permissions ?? {};

  function openReview() {
    void router.prefetch(reviewHref);
    router.push(reviewHref);
  }

  function prefetchReview() {
    void router.prefetch(reviewHref);
  }

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    if (typeof window !== "undefined" && window.getSelection?.()?.toString()) {
      return;
    }

    openReview();
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openReview();
    }
  }

  const rootProps: ComponentPropsWithoutRef<"article"> = {
    id: `review-${review.id}`,
    className: cn(
      interactive &&
        "cursor-pointer hover:bg-card/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
    ),
  };

  if (interactive) {
    rootProps.role = "link";
    rootProps.tabIndex = 0;
    rootProps.onClick = handleCardClick;
    rootProps.onKeyDown = handleCardKeyDown;
    rootProps.onMouseEnter = prefetchReview;
    rootProps.onFocusCapture = prefetchReview;
  }

  const card = (
    <ReviewCard
      review={review}
      entity={entity}
      author={author}
      display={display}
      rootProps={rootProps}
      slots={{
        authorName: author ? <LinkedAuthorName author={author} /> : undefined,
        entity: entity ? <LinkedEntitySummary entity={entity} mode={entityMode} /> : undefined,
        headerActions: showHeaderActions ? (
          <ReviewActionsMenu
            reviewId={review.id}
            reviewTitle={review.title}
            entityTitle={entity?.title ?? null}
            entityId={entity?.id ?? null}
            canManage={canManage}
            onToggleBookmark={() => bookmarkButtonRef.current?.click()}
          />
        ) : null,
        footer: showInteractionBar ? (
          <ReviewCardInteractionBar
            review={review}
            isAuthenticated={isAuthenticated}
            bookmarkButtonRef={bookmarkButtonRef}
          />
        ) : null,
      }}
    />
  );

  if (!showContextMenu) {
    return card;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="h-full">{card}</div>
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

export function FeedReviewCard({
  review,
  entity,
  author = null,
  isAuthenticated = false,
  canManage = false,
  featured = false,
}: FeedReviewCardProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildFeedReviewCardDisplay(featured)}
      permissions={{ isAuthenticated, canManage }}
    />
  );
}

export function TrackReviewCard({
  review,
  entity,
  author = null,
  isAuthenticated = false,
  canManage = false,
}: ReviewCardRouteProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildFeedReviewCardDisplay()}
      permissions={{ isAuthenticated, canManage }}
    />
  );
}

export function ProfileReviewCard({
  review,
  entity,
  author = null,
  isAuthenticated = false,
  canManage = false,
  featured = false,
}: ProfileReviewCardProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildFeedReviewCardDisplay(featured)}
      permissions={{ isAuthenticated, canManage }}
    />
  );
}

export function SavedReviewCard({
  review,
  entity,
  author = null,
  isAuthenticated = false,
  canManage = false,
}: ReviewCardRouteProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildFeedReviewCardDisplay()}
      permissions={{ isAuthenticated, canManage }}
    />
  );
}

export function ReviewPageCard({
  review,
  entity,
  author = null,
  isAuthenticated = false,
  canManage = false,
}: ReviewCardRouteProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildFeedReviewCardDisplay()}
      permissions={{ isAuthenticated, canManage }}
    />
  );
}
