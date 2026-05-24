"use client";

import { Star } from "lucide-react";
import TrackTile from "@/components/track-tile";
import type { ReviewCardData, ReviewCardEntity } from "@/components/review-card";

type ProfileRecentReview = ReviewCardData & {
  entities: ReviewCardEntity | null;
};

type ProfileRecentReviewsSectionProps = {
  reviews: ProfileRecentReview[];
  variant?: "auto" | "carousel" | "cards";
};

function RecentReviewTile({ review }: { review: ProfileRecentReview }) {
  const entity = review.entities;
  const entityId = entity?.id ?? null;

  return (
    <TrackTile
      href={entityId ? `/track/${entityId}` : undefined}
      queryWarmup={entityId ? { kind: "track", id: entityId } : undefined}
      title={entity?.title ?? "Untitled track"}
      artistName={entity?.artist_name}
      coverUrl={entity?.cover_url}
      sizes="(min-width: 1280px) 148px, (min-width: 768px) 22vw, 45vw"
      badge={
        <>
          <Star className="size-3 fill-amber-400 text-amber-400" />
          {review.rating.toFixed(1)}
        </>
      }
    />
  );
}

export default function ProfileRecentReviewsSection({
  reviews,
  variant = "auto",
}: ProfileRecentReviewsSectionProps) {
  if (reviews.length === 0) {
    return null;
  }

  const recentReviews = reviews.slice(0, 8);
  const shouldUseCards = variant === "cards" || (variant === "auto" && recentReviews.length <= 2);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
          Recent Activity
        </h2>
      </div>

      {shouldUseCards ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {recentReviews.map((review) => (
            <RecentReviewTile key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="-mx-1 overflow-hidden">
          <div className="scroll-mask-r scroll-mask-r-from-[calc(100%-3rem)] no-scrollbar flex gap-4 overflow-x-auto overscroll-x-contain px-1 pb-1">
            {recentReviews.map((review) => (
              <div
                key={review.id}
                className="w-[8.5rem] shrink-0 sm:w-[9rem] lg:w-[8.35rem] xl:w-[8.6rem]"
              >
                <RecentReviewTile review={review} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
