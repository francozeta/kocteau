import { FeedReviewCard } from "@/components/review-route-cards-server";
import JsonLd from "@/components/json-ld";
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

export default async function ReviewsPage() {
  const userId = await getCurrentUserId();
  const publicBundle = await getFeedPage({
    view: "latest",
    viewerId: userId,
    includeActiveUsers: false,
    limit: 14,
  });
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
    <section className="mx-auto w-full max-w-3xl space-y-5 pb-4 sm:space-y-6">
      <JsonLd data={buildReviewsPageJsonLd(structuredEntries)} id="reviews-structured-data" />

      <header className="space-y-2">
        <h1 className="font-serif text-[2rem] font-semibold leading-[1.05] tracking-normal text-foreground sm:text-[2.45rem]">
          Music reviews
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground text-pretty">
          Recent ratings and listening notes from Kocteau.
        </p>
      </header>

      <div className="space-y-4">
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
    </section>
  );
}
