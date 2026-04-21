import { ReviewCardSkeleton } from "@/components/feed-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3 rounded-full bg-muted-foreground/[0.12]", className)} />;
}

function PillSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        "h-7 rounded-full border border-border/24 bg-card/18",
        className,
      )}
    />
  );
}

export function TrackPageHeroSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="border-b border-border/32 pb-4 md:border-border/24 md:pb-5"
    >
      <div className="grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center lg:grid-cols-[11.5rem_minmax(0,1fr)] lg:gap-5">
        <Skeleton className="mx-auto size-[min(56vw,11rem)] rounded-[1.25rem] border border-border/24 bg-muted-foreground/[0.1] shadow-[0_12px_32px_rgba(0,0,0,0.18)] md:mx-0 md:size-[10rem] lg:size-[11.5rem]" />

        <div className="min-w-0 text-center md:text-left">
          <SkeletonLine className="mx-auto h-2.5 w-14 bg-muted-foreground/[0.08] md:mx-0" />
          <div className="mt-2.5 flex flex-col items-center gap-2 md:items-start">
            <SkeletonLine className="h-9 w-[min(28rem,88%)] bg-muted-foreground/[0.17] lg:h-11" />
            <SkeletonLine className="h-9 w-[min(18rem,62%)] bg-muted-foreground/[0.12] lg:h-11" />
          </div>
          <SkeletonLine className="mx-auto mt-3 h-3.5 w-36 bg-muted-foreground/[0.1] md:mx-0" />

          <div className="mt-4 grid grid-cols-[2.5rem_minmax(0,auto)_2.5rem] items-center justify-center gap-2.5 md:inline-grid md:grid-cols-[2.75rem_minmax(0,auto)_2.75rem] md:justify-start md:gap-3">
            <Skeleton className="size-10 rounded-full border border-border/28 bg-card/18 sm:size-11" />
            <Skeleton className="h-10 min-w-[10.5rem] rounded-full bg-muted-foreground/[0.18] sm:h-11 sm:min-w-[11.5rem]" />
            <Skeleton className="size-10 rounded-full border border-border/28 bg-card/18 sm:size-11" />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <PillSkeleton className="w-14" />
            <PillSkeleton className="w-20" />
            <PillSkeleton className="w-24" />
            <PillSkeleton className="w-16" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrackPageLoadingSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading track"
      className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-5"
    >
      <TrackPageHeroSkeleton />
      <div className="flex flex-col gap-4">
        <ReviewCardSkeleton />
        <ReviewCardSkeleton />
      </div>
    </section>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="border-b border-border/34 pb-4 md:border-border/30 md:pb-5"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4 md:gap-5">
          <Skeleton className="size-20 shrink-0 rounded-full border border-border/28 bg-muted-foreground/[0.12] md:size-24 md:border-border/20" />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <SkeletonLine className="h-6 w-[min(15rem,58vw)] bg-muted-foreground/[0.17] md:h-7" />
              <Skeleton className="h-5 w-16 rounded-full border border-foreground/18 bg-foreground/[0.045]" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="inline-flex items-center gap-1.5">
                <SkeletonLine className="h-3.5 w-7 bg-muted-foreground/[0.15]" />
                <SkeletonLine className="h-3.5 w-14 bg-muted-foreground/[0.09]" />
              </div>
              <div className="inline-flex items-center gap-1.5">
                <SkeletonLine className="h-3.5 w-12 bg-muted-foreground/[0.15]" />
                <SkeletonLine className="h-3.5 w-16 bg-muted-foreground/[0.09]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex max-w-2xl flex-col gap-2">
          <SkeletonLine className="h-3.5 w-32 bg-muted-foreground/[0.13]" />
          <SkeletonLine className="h-3.5 w-full bg-muted-foreground/[0.1]" />
          <SkeletonLine className="h-3.5 w-[72%] bg-muted-foreground/[0.08]" />
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            <SkeletonLine className="h-3 w-14 bg-muted-foreground/[0.08]" />
            <SkeletonLine className="h-3 w-20 bg-muted-foreground/[0.08]" />
            <SkeletonLine className="h-3 w-16 bg-muted-foreground/[0.08]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:max-w-[28rem]">
          <Skeleton className="h-9 rounded-xl border border-border/34 bg-card/16 md:border-border/25 md:bg-transparent" />
          <Skeleton className="h-9 rounded-xl border border-border/34 bg-card/16 md:border-border/25 md:bg-transparent" />
        </div>
      </div>
    </section>
  );
}

function RecentActivityTileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <Skeleton className="aspect-square rounded-lg border border-border/34 bg-muted-foreground/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:border-border/24" />
      <div className="mt-2 flex flex-col gap-1.5 px-0.5">
        <SkeletonLine className="h-3.5 w-[82%] bg-muted-foreground/[0.13]" />
        <SkeletonLine className="h-3 w-[58%] bg-muted-foreground/[0.08]" />
      </div>
    </div>
  );
}

export function ProfileRecentActivitySkeleton() {
  return (
    <section aria-hidden="true" className="flex flex-col gap-3">
      <div className="border-b border-border/32 pb-3 md:border-border/25">
        <SkeletonLine className="h-5 w-36 bg-muted-foreground/[0.15]" />
      </div>

      <div className="flex gap-3 overflow-hidden md:gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <RecentActivityTileSkeleton
            key={`recent-activity-${index}`}
            className="basis-[72%] shrink-0 sm:basis-[42%] md:basis-[31%] lg:basis-[24%] xl:basis-[20%]"
          />
        ))}
      </div>
    </section>
  );
}

export function SavedReviewsSectionSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="flex flex-col gap-4 border-t border-border/34 pt-8 [contain-intrinsic-size:720px] [content-visibility:auto] md:border-border/30"
    >
      <div className="border-b border-border/32 pb-4 md:border-border/25">
        <SkeletonLine className="h-3 w-14 bg-muted-foreground/[0.09]" />
      </div>

      <div className="flex flex-col gap-4">
        <ReviewCardSkeleton />
        <ReviewCardSkeleton />
      </div>
    </section>
  );
}

export function ProfilePageLoadingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading profile"
      className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-5"
    >
      <ProfileHeaderSkeleton />
      <div className="flex flex-col gap-5">
        <ProfileRecentActivitySkeleton />
        <section className="flex flex-col gap-4 pt-2">
          <div className="border-b border-border/32 pb-3 md:border-border/25">
            <SkeletonLine className="h-5 w-20 bg-muted-foreground/[0.15]" />
          </div>
          <div className="flex flex-col gap-4">
            <ReviewCardSkeleton featured />
            <ReviewCardSkeleton />
          </div>
        </section>
      </div>
    </div>
  );
}
