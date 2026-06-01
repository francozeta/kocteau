import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import ReviewPageHeaderBridge from "@/components/review-page-header-bridge";
import { ReviewPageCard } from "@/components/review-route-cards-server";
import { getCurrentUser } from "@/lib/auth/server";
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

  if (review.title?.trim() && entity) {
    return `${review.title.trim()} — ${entity.title}`;
  }

  if (entity) {
    const trackLabel = entity.artist_name
      ? `${entity.title} by ${entity.artist_name}`
      : entity.title;

    return `${trackLabel} review by ${authorLabel}`;
  }

  return `Review by ${authorLabel}`;
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
  const authorLabel = getAuthorLabel(review);
  const headerTitle = review.title?.trim() || (entity ? `${entity.title} review` : "Review");

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

      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground"
      >
        <Link href="/reviews" className="transition-colors hover:text-foreground">
          Reviews
        </Link>
        {entity ? (
          <>
            <span aria-hidden="true">/</span>
            <Link
              href={`/track/${entity.id}`}
              className="line-clamp-1 transition-colors hover:text-foreground"
            >
              {entity.title}
            </Link>
          </>
        ) : null}
        {author?.username ? (
          <>
            <span aria-hidden="true">/</span>
            <Link
              href={`/u/${author.username}`}
              className="line-clamp-1 transition-colors hover:text-foreground"
            >
              {authorLabel}
            </Link>
          </>
        ) : null}
      </nav>

      <ReviewPageCard
        review={review}
        entity={entity}
        author={author}
        isAuthenticated={Boolean(user)}
        canManage={canManage}
      />

      {entity ? (
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <span>More context</span>
          <Link
            href={`/track/${entity.id}`}
            className="rounded-[0.5rem] border border-border/28 px-2.5 py-1 text-foreground/86 transition-colors hover:border-border/45 hover:text-foreground"
          >
            {entity.title}
          </Link>
          {author?.username ? (
            <Link
              href={`/u/${author.username}`}
              className="rounded-[0.5rem] border border-border/28 px-2.5 py-1 text-foreground/86 transition-colors hover:border-border/45 hover:text-foreground"
            >
              @{author.username}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
