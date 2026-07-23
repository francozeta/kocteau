import Link from "next/link";

import ReviewCard, {
  getReviewCardCopyTone,
  ReviewCardEntityCover,
  ReviewCardEntitySummary,
} from "@/components/review-card";
import {
  buildEntityCanonicalPath,
  buildReviewCanonicalPath,
} from "@/lib/seo-routes";
import type { FeedBundleReview } from "@/queries/feed";

type GuestReviewListProps = {
  reviews: FeedBundleReview[];
};

export default function GuestReviewList({ reviews }: GuestReviewListProps) {
  return (
    <div className="space-y-3.5">
      {reviews.map((review, index) => {
        const entity = review.entities;
        const author = review.author;
        const reviewPath = buildReviewCanonicalPath({
          id: review.id,
          entities: entity,
        });
        const copyTone = getReviewCardCopyTone(review);
        const authorLabel = author?.display_name ??
          (author ? `@${author.username}` : "Unknown user");

        return (
          <div key={review.id} className="kocteau-review-card-list-item">
            <ReviewCard
              review={review}
              entity={entity}
              author={author}
              display={{
                bodyClampLines: 4,
                entityMode: "cover",
                imagePriority: index === 0,
              }}
              reviewHref={reviewPath}
              reviewLinkLabel={`Open ${entity?.title ?? "review"} by ${authorLabel}`}
              rootProps={{ id: `review-${review.id}` }}
              slots={{
                authorName: author ? (
                  <Link
                    href={`/u/${author.username}`}
                    data-prevent-review-link="true"
                    className="relative z-[2] text-xs font-medium text-foreground transition-colors hover:underline sm:text-sm"
                  >
                    {authorLabel}
                  </Link>
                ) : undefined,
                entity: entity ? (
                  <div data-prevent-review-link="true" className="relative z-[2]">
                    <Link href={buildEntityCanonicalPath(entity)} className="block">
                      <ReviewCardEntitySummary
                        entity={entity}
                        mode="cover"
                        interactive
                        priority={index === 0}
                        tone={copyTone}
                      />
                    </Link>
                  </div>
                ) : undefined,
                entityCover: entity ? (
                  <div data-prevent-review-link="true" className="relative z-[2]">
                    <Link href={buildEntityCanonicalPath(entity)} className="block">
                      <ReviewCardEntityCover entity={entity} priority={index === 0} />
                    </Link>
                  </div>
                ) : undefined,
                headerActions: null,
                footer: null,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
