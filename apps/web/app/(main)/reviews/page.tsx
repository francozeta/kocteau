import { Suspense } from "react";
import { FeedReviewStackSkeleton } from "@/components/feed/feed-loading-skeletons";
import { FeedReviewCard } from "@/components/reviews/review-route-cards-server";
import JsonLd from "@/components/shared/json-ld";
import { getCurrentUserId } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getFeedPage, getFeedViewerState } from "@/lib/queries/feed";
import { buildReviewsPageJsonLd } from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "Music Reviews",
  description:
    "Read recent public music reviews, ratings, and listening notes from Kocteau.",
  path: "/reviews",
});

async function PublicReviewsList() {
  // Public reviews and viewer identity are independent. Start the shared public
  // read immediately instead of serializing it behind session resolution.
  const [publicBundle, userId] = await Promise.all([
    getFeedPage({
      view: "latest",
      includeActiveUsers: false,
      publicOnly: true,
      limit: 14,
    }),
    getCurrentUserId(),
  ]);
  const viewerState =
    userId && publicBundle.feed.length > 0
      ? await getFeedViewerState(
          userId,
          publicBundle.feed.map((review) => review.id),
        )
      : {
          likedReviewIds: new Set<string>(),
          bookmarkedReviewIds: new Set<string>(),
        };
  const reviews = publicBundle.feed.map((review) => ({
    ...review,
    viewer_has_liked: viewerState.likedReviewIds.has(review.id),
    viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
  }));
  const structuredEntries = reviews.flatMap((review) => {
    const entity = review.entities;
    const author = review.author;

    if (!entity?.id || !author?.username) {
      return [];
    }

    return [
      {
        reviewId: review.id,
        reviewTitle: review.title,
        reviewBody: review.body,
        rating: review.rating,
        entity: {
          id: entity.id,
          provider: entity.provider,
          providerId: entity.provider_id,
          type: entity.type,
          title: entity.title,
          artistName: entity.artist_name,
          coverUrl: entity.cover_url,
        },
        author: {
          username: author.username,
          displayName: author.display_name,
        },
      },
    ];
  });

  return (
    <>
      <JsonLd data={buildReviewsPageJsonLd(structuredEntries)} id="reviews-structured-data" />
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No public reviews yet.</p>
        ) : null}
        {reviews.map((review, index) => {
          const entity = review.entities;
          const author = review.author;

          return (
            <FeedReviewCard
              key={review.id}
              review={review}
              entity={entity}
              author={author}
              isAuthenticated={Boolean(userId)}
              canManage={Boolean(userId && author?.id === userId)}
              featured={index === 0}
              showInteractionBar
            />
          );
        })}
      </div>
    </>
  );
}

export default function ReviewsPage() {
  return (
    <section className="w-full max-w-3xl space-y-5 pb-4 sm:space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-[2rem] font-medium leading-[1.05] tracking-normal text-foreground sm:text-[2.45rem]">
          Music reviews
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground text-pretty">
          Recent ratings and listening notes from Kocteau.
        </p>
      </header>

      <Suspense
        fallback={
          <div aria-busy="true" aria-label="Loading music reviews">
            <FeedReviewStackSkeleton />
          </div>
        }
      >
        <PublicReviewsList />
      </Suspense>
    </section>
  );
}
