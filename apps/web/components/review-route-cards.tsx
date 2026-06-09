"use client";

import type { ComponentPropsWithoutRef } from "react";
import type { EditReviewDialogSeed } from "@/components/edit-review-dialog";
import ReviewCard, {
  getReviewCardCopyTone,
  ReviewCardEntityCover,
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
import { buildEntityCanonicalPath, buildReviewCanonicalPath } from "@/lib/seo-routes";

export type ReviewCardBehaviorOptions = {
  showHeaderActions?: boolean;
  showInteractionBar?: boolean;
  showContextMenu?: boolean;
  openReviewLink?: boolean;
  commentInlineTarget?: {
    targetId: string;
    composerId?: string;
  } | null;
};

export type ReviewCardPermissions = {
  isAuthenticated?: boolean;
  canManage?: boolean;
};

type ReviewCardViewer = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
} | null;

type RoutedReviewCardProps = {
  review: ReviewCardData;
  entity: ReviewCardEntity | null;
  author?: ReviewCardAuthor | null;
  display?: ReviewCardDisplayOptions;
  behavior?: ReviewCardBehaviorOptions;
  permissions?: ReviewCardPermissions;
  analyticsSource?: string | null;
  viewer?: ReviewCardViewer;
};

type ReviewCardRouteProps = {
  review: ReviewCardData;
  entity: ReviewCardEntity | null;
  author?: ReviewCardAuthor | null;
  isAuthenticated?: boolean;
  canManage?: boolean;
  viewer?: ReviewCardViewer;
};

type FeedReviewCardProps = ReviewCardRouteProps & {
  featured?: boolean;
  imagePriority?: boolean;
  showInteractionBar?: boolean;
  recommendationEyebrow?: string | null;
  analyticsSource?: string | null;
};

type ProfileReviewCardProps = ReviewCardRouteProps & {
  featured?: boolean;
};

function buildFeedReviewCardDisplay(
  featured = false,
  eyebrow?: string | null,
  imagePriority = false,
): ReviewCardDisplayOptions {
  return {
    featured,
    imagePriority,
    bodyClampLines: 4,
    entityMode: "cover",
    eyebrow: eyebrow ?? undefined,
  };
}

function buildTrackReviewCardDisplay(): ReviewCardDisplayOptions {
  return {
    bodyClampLines: 4,
    showEntity: false,
  };
}

function buildSavedReviewCardDisplay(): ReviewCardDisplayOptions {
  return {
    bodyClampLines: 5,
    entityMode: "cover",
  };
}

function buildReviewPageCardDisplay(): ReviewCardDisplayOptions {
  return {
    entityMode: "cover",
    entityHeadingLevel: 1,
  };
}

function getAuthorLabel(author: ReviewCardAuthor | null | undefined) {
  return author?.display_name ?? (author ? `@${author.username}` : "Unknown user");
}

function getReviewLinkLabel(
  entity: ReviewCardEntity | null,
  author: ReviewCardAuthor | null | undefined,
) {
  const subject = entity?.title ? `${entity.title} review` : "review";

  return `Open ${subject} by ${getAuthorLabel(author)}`;
}

function LinkedAuthorName({ author }: { author: ReviewCardAuthor | null | undefined }) {
  if (!author) {
    return null;
  }

  return (
    <PrefetchLink
      href={`/u/${author.username}`}
      data-prevent-review-link="true"
      className="relative z-[2] text-xs font-medium text-foreground transition-colors hover:underline sm:text-sm"
    >
      {getAuthorLabel(author)}
    </PrefetchLink>
  );
}

function LinkedEntitySummary({
  entity,
  mode,
  priority = false,
  tone = "default",
  headingLevel,
}: {
  entity: ReviewCardEntity | null;
  mode: "full" | "inline" | "cover";
  priority?: boolean;
  tone?: "default" | "balanced";
  headingLevel?: 1 | 2 | 3;
}) {
  if (!entity) {
    return null;
  }

  return (
    <div data-prevent-review-link="true" className="relative z-[2]">
      <PrefetchLink
        href={buildEntityCanonicalPath(entity)}
        queryWarmup={{ kind: "track", id: entity.id }}
        className="block"
      >
        <ReviewCardEntitySummary
          entity={entity}
          mode={mode}
          interactive
          priority={priority}
          tone={tone}
          headingLevel={headingLevel}
        />
      </PrefetchLink>
    </div>
  );
}

function LinkedEntityCover({
  entity,
  priority = false,
}: {
  entity: ReviewCardEntity | null;
  priority?: boolean;
}) {
  if (!entity) {
    return null;
  }

  return (
    <div data-prevent-review-link="true" className="relative z-[2]">
      <PrefetchLink
        href={buildEntityCanonicalPath(entity)}
        queryWarmup={{ kind: "track", id: entity.id }}
        className="block"
      >
        <ReviewCardEntityCover entity={entity} priority={priority} />
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
  analyticsSource = null,
  viewer = null,
}: RoutedReviewCardProps) {
  const { entityMode = "full" } = display ?? {};
  const entityHeadingLevel = display?.entityHeadingLevel;
  const entityPriority = Boolean(display?.featured || display?.imagePriority);
  const copyTone = getReviewCardCopyTone(review);
  const {
    showHeaderActions = true,
    showInteractionBar = true,
    showContextMenu = true,
    openReviewLink = true,
    commentInlineTarget = null,
  } = behavior ?? {};
  const { isAuthenticated = false, canManage = false } = permissions ?? {};
  const initialBookmarked = Boolean(review.viewer_has_bookmarked);
  const editSeed: EditReviewDialogSeed | null =
    canManage &&
    entity?.provider === "deezer" &&
    entity.provider_id &&
    entity.type === "track"
      ? {
          initialSelection: {
            provider: "deezer",
            provider_id: entity.provider_id,
            type: "track",
            title: entity.title,
            artist_name: entity.artist_name,
            cover_url: entity.cover_url,
            deezer_url: entity.deezer_url ?? null,
            entity_id: entity.id,
          },
          initialTitle: review.title ?? "",
          initialBody: review.body ?? "",
          initialRating: review.rating,
          initialPinned: Boolean(review.is_pinned),
        }
      : null;

  const rootProps: ComponentPropsWithoutRef<"article"> = {
    id: `review-${review.id}`,
  };
  const entityPath = entity ? buildEntityCanonicalPath(entity) : null;
  const reviewPath = buildReviewCanonicalPath({ id: review.id, entities: entity });

  const card = (
    <ReviewCard
      review={review}
      entity={entity}
      author={author}
      display={display}
      rootProps={rootProps}
      reviewHref={openReviewLink ? reviewPath : null}
      reviewLinkLabel={getReviewLinkLabel(entity, author)}
      slots={{
        authorName: author ? <LinkedAuthorName author={author} /> : undefined,
        entity: entity ? (
          <LinkedEntitySummary
            entity={entity}
            mode={entityMode}
            priority={entityPriority}
            tone={copyTone}
            headingLevel={entityHeadingLevel}
          />
        ) : undefined,
        entityCover:
          entity && entityMode === "cover" ? (
            <LinkedEntityCover entity={entity} priority={entityPriority} />
          ) : undefined,
        headerActions: showHeaderActions ? (
          <ReviewActionsMenu
            reviewId={review.id}
            reviewTitle={review.title}
            entityTitle={entity?.title ?? null}
            entityId={entity?.id ?? null}
            reviewPath={reviewPath}
            entityPath={entityPath}
            canManage={canManage}
            editSeed={editSeed}
            initialBookmarked={initialBookmarked}
            isAuthenticated={isAuthenticated}
          />
        ) : null,
        footer: showInteractionBar ? (
          <ReviewCardInteractionBar
            review={review}
            isAuthenticated={isAuthenticated}
            viewer={viewer}
            analyticsSource={analyticsSource}
            commentInlineTarget={commentInlineTarget}
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
        reviewPath={reviewPath}
        entityPath={entityPath}
        canManage={canManage}
        editSeed={editSeed}
        initialBookmarked={initialBookmarked}
        isAuthenticated={isAuthenticated}
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
  imagePriority = false,
  showInteractionBar = true,
  recommendationEyebrow = null,
  analyticsSource = null,
  viewer = null,
}: FeedReviewCardProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildFeedReviewCardDisplay(featured, recommendationEyebrow, imagePriority)}
      behavior={{ showInteractionBar }}
      permissions={{ isAuthenticated, canManage }}
      analyticsSource={analyticsSource}
      viewer={viewer}
    />
  );
}

export function TrackReviewCard({
  review,
  entity,
  author = null,
  isAuthenticated = false,
  canManage = false,
  viewer = null,
}: ReviewCardRouteProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildTrackReviewCardDisplay()}
      permissions={{ isAuthenticated, canManage }}
      viewer={viewer}
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
  viewer = null,
}: ProfileReviewCardProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildFeedReviewCardDisplay(featured)}
      permissions={{ isAuthenticated, canManage }}
      viewer={viewer}
    />
  );
}

export function SavedReviewCard({
  review,
  entity,
  author = null,
  isAuthenticated = false,
  canManage = false,
  viewer = null,
}: ReviewCardRouteProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildSavedReviewCardDisplay()}
      permissions={{ isAuthenticated, canManage }}
      viewer={viewer}
    />
  );
}

export function ReviewPageCard({
  review,
  entity,
  author = null,
  isAuthenticated = false,
  canManage = false,
  viewer = null,
}: ReviewCardRouteProps) {
  return (
    <RoutedReviewCard
      review={review}
      entity={entity}
      author={author}
      display={buildReviewPageCardDisplay()}
      behavior={{
        openReviewLink: false,
        commentInlineTarget: {
          targetId: "review-replies",
          composerId: "review-reply-composer",
        },
      }}
      permissions={{ isAuthenticated, canManage }}
      viewer={viewer}
    />
  );
}
