import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import type { EditReviewDialogSeed } from "@/components/edit-review-dialog";
import ReviewCard, {
  ReviewCardEntitySummary,
  type ReviewCardAuthor,
  type ReviewCardData,
  type ReviewCardDisplayOptions,
  type ReviewCardEntity,
} from "@/components/review-card";
import ReviewActionsMenu from "@/components/review-actions-menu";
import ReviewCardContextMenuFrame from "@/components/review-card-context-menu-frame";
import ReviewCardInteractionBar from "@/components/review-card-interaction-bar";

export type ReviewCardBehaviorOptions = {
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

function getAuthorLabel(author: ReviewCardAuthor | null | undefined) {
  return author?.display_name ?? (author ? `@${author.username}` : "Unknown user");
}

function createEditSeed(
  review: ReviewCardData,
  entity: ReviewCardEntity | null,
  canManage: boolean,
): EditReviewDialogSeed | null {
  if (
    !canManage ||
    entity?.provider !== "deezer" ||
    !entity.provider_id ||
    entity.type !== "track"
  ) {
    return null;
  }

  return {
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
  };
}

function LinkedAuthorName({ author }: { author: ReviewCardAuthor | null | undefined }) {
  if (!author) {
    return null;
  }

  return (
    <Link
      href={`/u/${author.username}`}
      data-prevent-review-link="true"
      className="text-xs font-medium text-foreground transition-colors hover:underline sm:text-sm"
    >
      {getAuthorLabel(author)}
    </Link>
  );
}

function LinkedEntitySummary({
  entity,
  mode,
  priority = false,
}: {
  entity: ReviewCardEntity | null;
  mode: "full" | "inline";
  priority?: boolean;
}) {
  if (!entity) {
    return null;
  }

  return (
    <div data-prevent-review-link="true">
      <Link href={`/track/${entity.id}`} className="block">
        <ReviewCardEntitySummary
          entity={entity}
          mode={mode}
          interactive
          priority={priority}
        />
      </Link>
    </div>
  );
}

function RoutedReviewCardServer({
  review,
  entity,
  author = null,
  display,
  behavior,
  permissions,
}: RoutedReviewCardProps) {
  const { entityMode = "full" } = display ?? {};
  const entityPriority = Boolean(display?.featured);
  const {
    showHeaderActions = true,
    showInteractionBar = true,
    showContextMenu = true,
  } = behavior ?? {};
  const { isAuthenticated = false, canManage = false } = permissions ?? {};
  const editSeed = createEditSeed(review, entity, canManage);
  const rootProps: ComponentPropsWithoutRef<"article"> = {
    id: `review-${review.id}`,
  };
  const initialBookmarked = Boolean(review.viewer_has_bookmarked);

  const card = (
    <ReviewCard
      review={review}
      entity={entity}
      author={author}
      display={display}
      rootProps={rootProps}
      slots={{
        authorName: author ? <LinkedAuthorName author={author} /> : undefined,
        entity: entity ? (
          <LinkedEntitySummary
            entity={entity}
            mode={entityMode}
            priority={entityPriority}
          />
        ) : undefined,
        headerActions: showHeaderActions ? (
          <ReviewActionsMenu
            reviewId={review.id}
            reviewTitle={review.title}
            entityTitle={entity?.title ?? null}
            entityId={entity?.id ?? null}
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
          />
        ) : null,
      }}
    />
  );

  if (!showContextMenu) {
    return card;
  }

  return (
    <ReviewCardContextMenuFrame
      reviewId={review.id}
      reviewTitle={review.title}
      entityTitle={entity?.title ?? null}
      entityId={entity?.id ?? null}
      canManage={canManage}
      editSeed={editSeed}
      initialBookmarked={initialBookmarked}
      isAuthenticated={isAuthenticated}
    >
      {card}
    </ReviewCardContextMenuFrame>
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
    <RoutedReviewCardServer
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
    <RoutedReviewCardServer
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
    <RoutedReviewCardServer
      review={review}
      entity={entity}
      author={author}
      display={buildFeedReviewCardDisplay(featured)}
      permissions={{ isAuthenticated, canManage }}
    />
  );
}
