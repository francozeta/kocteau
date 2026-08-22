import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import type {
  TrackRecommendation,
  TrackRecommendationGroup,
} from "@/lib/queries/track-recommendations";
import { cn } from "@/lib/utils";

type TrackMoreToHearProps = {
  groups: TrackRecommendationGroup[];
  className?: string;
};

export function TrackMoreToHearSkeleton() {
  return (
    <section
      className="space-y-4 border-b border-border/24 pb-5"
      aria-label="Loading recommendations"
      aria-busy="true"
    >
      <div className="space-y-2 px-0.5">
        <div className="h-2.5 w-14 rounded-full bg-foreground/[0.045]" />
        <div className="h-4 w-28 rounded-full bg-foreground/[0.065]" />
      </div>
      <div className="grid gap-x-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, groupIndex) => (
          <div
            key={groupIndex}
            className="space-y-3 border-t border-border/14 py-3"
          >
            <div className="h-2.5 w-20 rounded-full bg-foreground/[0.05]" />
            <div className="h-[10.75rem] rounded-[0.7rem] bg-foreground/[0.025]" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendationRow({
  recommendation,
}: {
  recommendation: TrackRecommendation;
}) {
  return (
    <PrefetchLink
      href={recommendation.href}
      className="group grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-[0.7rem] p-1.5 outline-none transition-colors duration-150 hover:bg-foreground/[0.035] focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <EntityCoverImage
        src={recommendation.cover_url}
        alt=""
        sizes="48px"
        quality={74}
        variant="thumbnail"
        className="size-12 rounded-[0.55rem] bg-muted/30 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        iconClassName="size-4"
      />
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-foreground/88 group-hover:text-foreground">
          {recommendation.title}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground/58">
          {recommendation.artist_name || "Unknown artist"}
        </span>
        <span className="mt-0.5 block line-clamp-1 text-[10px] text-muted-foreground/42">
          {recommendation.reason}
        </span>
      </span>
    </PrefetchLink>
  );
}

export default function TrackMoreToHear({
  groups,
  className,
}: TrackMoreToHearProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "space-y-4 border-b border-border/24 pb-5",
        className,
      )}
      aria-labelledby="track-routes-title"
    >
      <div className="px-0.5">
        <p className="text-[10px] font-medium text-muted-foreground/48">Music map</p>
        <h2
          id="track-routes-title"
          className="mt-1 font-pixel text-[1rem] font-medium text-foreground"
        >
          Where to next
        </h2>
      </div>

      <div className="grid gap-x-6 sm:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.id}
            className="border-t border-border/14 py-3"
            aria-label={group.label}
          >
            <div className="px-1.5 pb-2">
              <h3 className="text-[11px] font-medium text-foreground/82">
                {group.label}
              </h3>
              <p className="mt-0.5 text-pretty text-[10px] leading-4 text-muted-foreground/48">
                {group.description}
              </p>
            </div>
            <div className="grid gap-0.5">
              {group.recommendations.slice(0, 3).map((recommendation) => (
                <RecommendationRow
                  key={`${recommendation.provider}:${recommendation.provider_id}`}
                  recommendation={recommendation}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
