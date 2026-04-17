"use client";

import { Star } from "lucide-react";
import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import type { ReviewCardData, ReviewCardEntity } from "@/components/review-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type ProfileRecentReview = ReviewCardData & {
  entities: ReviewCardEntity | null;
};

type ProfileRecentReviewsSectionProps = {
  reviews: ProfileRecentReview[];
  variant?: "auto" | "carousel" | "cards";
};

function RecentReviewTile({
  review,
  compact = false,
}: {
  review: ProfileRecentReview;
  compact?: boolean;
}) {
  const entity = review.entities;
  const entityId = entity?.id ?? null;

  const tile = (
    <article className="group min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border/34 bg-card/32 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-colors group-hover:border-border/52 group-hover:bg-card/46 md:border-border/24 md:bg-card/24 md:group-hover:border-border/40 md:group-hover:bg-card/34">
        <EntityCoverImage
          src={entity?.cover_url}
          alt={entity?.title ?? "Reviewed track"}
          sizes={compact ? "45vw" : "(min-width: 1280px) 210px, (min-width: 768px) 28vw, 72vw"}
          quality={64}
          className="absolute inset-0 bg-muted"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
          iconClassName="size-7"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-black/6" />
        <div className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-black/48 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          {review.rating.toFixed(1)}
        </div>
      </div>

      <div className="mt-2 min-w-0 space-y-0.5 px-0.5">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">
          {entity?.title ?? "Untitled track"}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {entity?.artist_name ?? "Unknown artist"}
        </p>
      </div>
    </article>
  );

  if (!entityId) {
    return tile;
  }

  const href = `/track/${entityId}`;

  return (
    <PrefetchLink
      href={href}
      queryWarmup={{ kind: "track", id: entityId }}
      className="block outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {tile}
    </PrefetchLink>
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
      <div className="border-b border-border/32 pb-3 md:border-border/25">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
          Recent Activity
        </h2>
      </div>

      {shouldUseCards ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {recentReviews.map((review) => (
            <RecentReviewTile key={review.id} review={review} compact />
          ))}
        </div>
      ) : (
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
            containScroll: "trimSnaps",
          }}
          className="group/profile-reviews"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {recentReviews.map((review) => (
              <CarouselItem
                key={review.id}
                className="basis-[72%] pl-3 sm:basis-[42%] md:basis-[31%] lg:basis-[24%] xl:basis-[20%] md:pl-4"
              >
                <RecentReviewTile review={review} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden border-border/34 bg-background/88 text-foreground shadow-none backdrop-blur-md hover:bg-muted/40 disabled:opacity-0 md:inline-flex md:-left-4" />
          <CarouselNext className="hidden border-border/34 bg-background/88 text-foreground shadow-none backdrop-blur-md hover:bg-muted/40 disabled:opacity-0 md:inline-flex md:-right-4" />
        </Carousel>
      )}
    </section>
  );
}
