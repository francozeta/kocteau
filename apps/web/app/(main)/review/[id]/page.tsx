import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import ReviewCommentsPanel from "@/components/review-comments-panel";
import ReviewPageHeaderBridge from "@/components/review-page-header-bridge";
import { ReviewPageCard } from "@/components/review-route-cards-server";
import { getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import { createPageMetadata, createReviewDescription } from "@/lib/metadata";
import {
  getPublicReviewById,
  getReviewPageBundle,
  type ReviewPageReview,
} from "@/lib/queries/reviews";
import { buildReviewPageJsonLd } from "@/lib/structured-data";
import { reviewIdParamsSchema } from "@/lib/validation/schemas";

function getAuthorLabel(review: ReviewPageReview) {
  const author = review.author;

  if (!author) {
    return "a Kocteau listener";
  }

  return author.display_name?.trim() || `@${author.username}`;
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

function getTrackLabel(review: ReviewPageReview) {
  const entity = review.entities;

  if (!entity) {
    return "Review";
  }

  return entity.artist_name ? `${entity.title} by ${entity.artist_name}` : entity.title;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const parsedParams = reviewIdParamsSchema.safeParse({ reviewId: id });

  if (!parsedParams.success) {
    return createPageMetadata({
      title: "Review",
      description: "A public music review on Kocteau.",
      path: `/review/${id}`,
      noIndex: true,
    });
  }

  const review = await getPublicReviewById(parsedParams.data.reviewId);

  if (!review?.entities) {
    return createPageMetadata({
      title: "Review",
      description: "A public music review on Kocteau.",
      path: `/review/${id}`,
    });
  }

  const authorLabel = getAuthorLabel(review);

  return createPageMetadata({
    title: getReviewTitle(review),
    description: createReviewDescription({
      title: review.title,
      body: review.body,
      entityTitle: review.entities.title,
      artistName: review.entities.artist_name,
      authorLabel,
    }),
    path: `/review/${review.id}`,
    image: `/api/og/track/${review.entities.id}`,
  });
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedParams = reviewIdParamsSchema.safeParse({ reviewId: id });

  if (!parsedParams.success) {
    notFound();
  }

  const user = await getCurrentUser();
  const viewerProfile = user ? await getCurrentViewerProfile() : null;
  const bundle = await getReviewPageBundle(parsedParams.data.reviewId, user?.id);

  if (!bundle) {
    notFound();
  }

  const review = {
    ...bundle.review,
    viewer_has_liked: bundle.liked,
    viewer_has_bookmarked: bundle.bookmarked,
  };
  const entity = review.entities;
  const author = review.author;
  const canManage = Boolean(user?.id && author?.id === user.id);
  const headerTitle = getTrackLabel(review);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4 pb-4 sm:space-y-5">
      <JsonLd data={buildReviewPageJsonLd(review)} id="review-structured-data" />
      <ReviewPageHeaderBridge
        reviewId={review.id}
        entityId={entity?.id}
        isAuthenticated={Boolean(user)}
        title={headerTitle}
        entityTitle={entity?.title}
        artistName={entity?.artist_name}
      />

      <ReviewPageCard
        review={review}
        entity={entity}
        author={author}
        isAuthenticated={Boolean(user)}
        canManage={canManage}
      />

      <ReviewCommentsPanel
        reviewId={review.id}
        initialCount={review.comments_count}
        isAuthenticated={Boolean(user)}
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
      />
    </section>
  );
}
