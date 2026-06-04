import TrackCarousel from "@/components/track-carousel";
import TrackTile from "@/components/track-tile";
import type {
  TrackRecommendation,
  TrackRecommendationGroup,
} from "@/lib/queries/track-recommendations";
import { cn } from "@/lib/utils";

type TrackMoreToHearProps = {
  groups: TrackRecommendationGroup[];
  className?: string;
};

function RecommendationTile({ recommendation }: { recommendation: TrackRecommendation }) {
  return (
    <div className="min-w-0">
      <TrackTile
        href={recommendation.href}
        title={recommendation.title}
        artistName={recommendation.artist_name}
        coverUrl={recommendation.cover_url}
        sizes="(max-width: 640px) 38vw, (max-width: 1024px) 132px, 144px"
        coverClassName="rounded-[0.7rem]"
        titleClassName="text-[12px] leading-4 sm:text-[13px]"
        artistClassName="text-[11px] leading-4"
      />
    </div>
  );
}

export default function TrackMoreToHear({
  groups,
  className,
}: TrackMoreToHearProps) {
  const recommendations = groups.flatMap((group) => group.recommendations);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "space-y-4 border-b border-border/24 pb-4 md:pb-5",
        className,
      )}
      aria-label="More to hear"
    >
      <div className="px-0.5">
        <p className="text-[12px] font-medium leading-none text-muted-foreground/72">
          More like this
        </p>
      </div>

      <TrackCarousel
        ariaLabel="More like this"
        compactControls
        contentClassName="gap-3.5"
        controlClassName="left-2 right-2 [--kocteau-carousel-cover-size:8.05rem] lg:[--kocteau-carousel-cover-size:8.25rem]"
        itemClassName="basis-[8.05rem] sm:basis-[8.35rem] lg:basis-[8.25rem]"
      >
        {recommendations.map((recommendation) => (
          <RecommendationTile
            key={`${recommendation.provider}:${recommendation.provider_id}`}
            recommendation={recommendation}
          />
        ))}
      </TrackCarousel>
    </section>
  );
}
