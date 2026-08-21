import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import JsonLd from "@/components/json-ld";
import ReviewCommentsPanel from "@/components/review-comments-panel";
import ReviewPageHeaderBridge from "@/components/review-page-header-bridge";
import {
  createReviewEditSeed,
  ReviewPageCard,
} from "@/components/review-route-cards-server";
import { getCurrentUserId, getCurrentViewerProfile } from "@/lib/auth/server";
import { createPageMetadata, createReviewDescription } from "@/lib/metadata";
import {
  getPublicReviewByRouteId,
  getReviewViewerState,
  type ReviewPageReview,
} from "@/lib/queries/reviews";
import { isPublicReviewIndexable } from "@/lib/reviews/public-content";
import {
  buildEntityCanonicalPath,
  buildReviewCanonicalPath,
  isSeoRouteId,
} from "@/lib/seo-routes";
import { buildReviewPageJsonLd } from "@/lib/structured-data";

function getAuthorLabel(review: ReviewPageReview) {
  const author = review.author;

  if (!author) {
    return "a Kocteau listener";
  }

  return author.display_name?.trim() || `@${author.username}`;
}

function getTrackLabel(review: ReviewPageReview) {
  const entity = review.entities;

  if (!entity) {
    return "Review";
  }

  return entity.artist_name ? `${entity.title} by ${entity.artist_name}` : entity.title;
}

function getReviewTitle(review: ReviewPageReview) {
  const entity = review.entities;
  const authorLabel = getAuthorLabel(review);

  if (entity) {
    const trackLabel = getTrackLabel(review);
    const reviewTitle = review.title?.trim();

    return reviewTitle
      ? `${trackLabel} review by ${authorLabel}: ${reviewTitle}`
      : `${trackLabel} review by ${authorLabel}`;
  }

  return `Review by ${authorLabel}`;
}

type ReviewRouteParams = {
  reviewId: string;
  slug: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<ReviewRouteParams>;
}): Promise<Metadata> {
  const { reviewId } = await params;

  if (!isSeoRouteId(reviewId)) {
    notFound();
  }

  const review = await getPublicReviewByRouteId(reviewId);

  if (!review?.entities) {
    notFound();
  }

  const authorLabel = getAuthorLabel(review);
  const canonicalPath = buildReviewCanonicalPath(review);

  return createPageMetadata({
    title: getReviewTitle(review),
    description: createReviewDescription({
      title: review.title,
      body: review.body,
      entityTitle: review.entities.title,
      artistName: review.entities.artist_name,
      authorLabel,
    }),
    path: canonicalPath,
    image: `/api/og/track/${review.entities.id}`,
    noIndex: !isPublicReviewIndexable(review),
  });
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<ReviewRouteParams>;
}) {
  const { reviewId, slug } = await params;

  if (!isSeoRouteId(reviewId)) {
    notFound();
  }

  const [userId, routeReview] = await Promise.all([
    getCurrentUserId(),
    getPublicReviewByRouteId(reviewId),
  ]);

  if (!routeReview) {
    notFound();
  }

  const [viewerProfile, viewerState] = await Promise.all([
    userId ? getCurrentViewerProfile() : null,
    getReviewViewerState(userId, routeReview.id),
  ]);

  const canonicalPath = buildReviewCanonicalPath(routeReview);

  if (canonicalPath !== `/reviews/${reviewId}/${slug}`) {
    permanentRedirect(canonicalPath);
  }

  const review = {
    ...routeReview,
    viewer_has_liked: viewerState.liked,
    viewer_has_bookmarked: viewerState.bookmarked,
  };
  const entity = review.entities;
  const author = review.author;
  const canManage = Boolean(userId && author?.id === userId);
  const headerTitle = getTrackLabel(review);
  const editSeed = createReviewEditSeed(review, entity, canManage);

  return (
    <section className="w-full max-w-3xl space-y-3 pb-4 sm:space-y-4">
      <JsonLd data={buildReviewPageJsonLd(review)} id="review-structured-data" />
      <ReviewPageHeaderBridge
        reviewId={review.id}
        commentsCount={review.comments_count}
        entityId={entity?.id}
        isAuthenticated={Boolean(userId)}
        title={headerTitle}
        entityTitle={entity?.title}
        artistName={entity?.artist_name}
        sharePath={canonicalPath}
        reviewTitle={review.title}
        entityPath={entity ? buildEntityCanonicalPath(entity) : null}
        canManage={canManage}
        editSeed={editSeed}
        initialBookmarked={viewerState.bookmarked}
      />

      <ReviewPageCard
        review={review}
        entity={entity}
        author={author}
        isAuthenticated={Boolean(userId)}
        canManage={canManage}
      />

      <ReviewCommentsPanel
        reviewId={review.id}
        initialCount={review.comments_count}
        isAuthenticated={Boolean(userId)}
        viewer={
          viewerProfile
            ? {
                id: viewerProfile.id,
                username: viewerProfile.username,
                display_name: viewerProfile.display_name,
                avatar_url: viewerProfile.avatar_url,
              }
            : null
        }
        variant="inline"
        replyTarget={author?.username ?? null}
        anchorId="review-replies"
        composerId="review-reply-composer"
      />
    </section>
  );
}
