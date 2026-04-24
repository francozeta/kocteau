import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ReviewCardSkeletonProps = {
  featured?: boolean;
  showEyebrow?: boolean;
};

type FeedControlsSkeletonProps = {
  fullWidth?: boolean;
};

type WhoToFollowRailSkeletonProps = {
  showHeading?: boolean;
};

function SkeletonLine({
  className,
}: {
  className?: string;
}) {
  return <Skeleton className={cn("h-3 rounded-full bg-muted-foreground/[0.13]", className)} />;
}

export function FeedSearchSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-11 w-full items-center gap-3 rounded-[0.95rem] border border-white/[0.08] bg-[#111112] px-4"
    >
      <Skeleton className="size-4 shrink-0 rounded-full bg-muted-foreground/[0.12]" />
      <SkeletonLine className="h-3.5 w-[min(18rem,72%)] bg-muted-foreground/[0.1]" />
    </div>
  );
}

export function FeedControlsSkeleton({
  fullWidth = false,
}: FeedControlsSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative grid min-w-0 grid-cols-3 gap-0.5 overflow-hidden rounded-[0.95rem] border border-white/[0.08] bg-[#111112] p-1",
        fullWidth ? "w-full" : "w-full max-w-[16.75rem] lg:w-[16.75rem]",
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/3 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.08] opacity-0"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2/3 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.08]"
      />

      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`feed-control-${index}`}
          className={cn(
            "relative z-10 flex h-8 items-center justify-center rounded-[0.7rem]",
            index === 0 && "bg-white/[0.08]",
          )}
        >
          <Skeleton
            className={cn(
              "h-3 rounded-full bg-muted-foreground/[0.12]",
              index === 0 ? "w-11 bg-muted-foreground/[0.2]" : index === 1 ? "w-[4rem]" : "w-7",
            )}
          />
        </div>
      ))}
    </div>
  );
}

export function ReviewCardSkeleton({
  featured = false,
  showEyebrow = false,
}: ReviewCardSkeletonProps) {
  return (
    <article
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-[1.15rem] border border-border/26 bg-card/24",
        featured && "bg-card/32",
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-[1.125rem]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Skeleton className="size-7 shrink-0 rounded-full bg-muted-foreground/[0.12]" />
            <div className="flex min-w-0 flex-col gap-1.5">
              {showEyebrow ? (
                <SkeletonLine className="h-2.5 w-16 bg-muted-foreground/[0.08]" />
              ) : null}
              <div className="flex items-center gap-2">
                <SkeletonLine className="h-3.5 w-20 bg-muted-foreground/[0.14]" />
                <Skeleton className="size-1 rounded-full bg-muted-foreground/[0.08]" />
                <SkeletonLine className="h-3 w-16 bg-muted-foreground/[0.08]" />
              </div>
            </div>
          </div>

          <Skeleton className="h-8 w-12 rounded-full bg-muted-foreground/[0.08]" />
        </div>

        <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[7.75rem_minmax(0,1fr)] lg:grid-cols-[8.5rem_minmax(0,1fr)]">
          <Skeleton className="aspect-square w-full rounded-[1rem] bg-muted-foreground/[0.1]" />

          <div className="flex min-w-0 flex-col justify-center gap-2.5 self-stretch">
            <SkeletonLine className="h-6 w-[min(16rem,86%)] bg-muted-foreground/[0.16] sm:h-7" />
            <SkeletonLine className="h-4 w-[min(10rem,58%)] bg-muted-foreground/[0.1]" />
            <div className="flex flex-col gap-1.5 pt-1">
              <SkeletonLine className="h-3.5 w-full bg-muted-foreground/[0.09]" />
              <SkeletonLine className="h-3.5 w-[82%] bg-muted-foreground/[0.07]" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/18 pt-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-10 rounded-full bg-muted-foreground/[0.08]" />
            <Skeleton className="h-3 w-8 rounded-full bg-muted-foreground/[0.06]" />
          </div>
          <Skeleton className="h-3 w-12 rounded-full bg-muted-foreground/[0.06]" />
        </div>
      </div>
    </article>
  );
}

export function FeedStarterLayerSkeleton() {
  return (
    <section aria-hidden="true" className="flex flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-2 px-0.5">
        <SkeletonLine className="h-2.5 w-20 bg-muted-foreground/[0.08]" />
        <SkeletonLine className="h-6 w-[min(16rem,78vw)] bg-muted-foreground/[0.14]" />
      </div>

      <article className="overflow-hidden rounded-[1.15rem] border border-border/26 bg-card/22">
        <div className="grid gap-0 md:grid-cols-[8.75rem_minmax(0,1fr)]">
          <div className="p-3 md:border-r md:border-border/18">
            <Skeleton className="aspect-square w-full rounded-[1rem] bg-muted-foreground/[0.09]" />
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-3 p-4">
            <SkeletonLine className="h-3 w-16 bg-muted-foreground/[0.08]" />
            <SkeletonLine className="h-7 w-[min(18rem,84%)] bg-muted-foreground/[0.15]" />
            <SkeletonLine className="h-4 w-[min(10rem,56%)] bg-muted-foreground/[0.1]" />
            <div className="flex flex-col gap-1.5 pt-1">
              <SkeletonLine className="h-3.5 w-full bg-muted-foreground/[0.09]" />
              <SkeletonLine className="h-3.5 w-[78%] bg-muted-foreground/[0.07]" />
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function RailProfileSkeleton({ index }: { index: number }) {
  return (
    <div className="rounded-[1.2rem] px-3 py-2.5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full bg-muted-foreground/[0.12]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
          <SkeletonLine
            className={cn(
              "h-3.5 bg-muted-foreground/[0.13]",
              index === 0 ? "w-24" : index === 1 ? "w-20" : "w-28",
            )}
          />
          <SkeletonLine
            className={cn(
              "h-3 bg-muted-foreground/[0.08]",
              index === 0 ? "w-16" : index === 1 ? "w-24" : "w-[4.5rem]",
            )}
          />
        </div>
        <Skeleton className="h-7 w-14 shrink-0 rounded-full bg-muted-foreground/[0.07]" />
      </div>
    </div>
  );
}

export function WhoToFollowRailSkeleton({
  showHeading = true,
}: WhoToFollowRailSkeletonProps = {}) {
  const rail = (
    <>
      {showHeading ? (
        <SkeletonLine className="h-3 w-28 bg-muted-foreground/[0.09]" />
      ) : null}
      <div className="flex flex-col gap-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <RailProfileSkeleton key={`rail-profile-${index}`} index={index} />
        ))}
      </div>
    </>
  );

  if (!showHeading) {
    return rail;
  }

  return <aside className="hidden flex-col gap-3 lg:flex">{rail}</aside>;
}

export function FeedReviewStackSkeleton() {
  return (
    <div className="flex flex-col gap-3.5">
      <ReviewCardSkeleton featured showEyebrow />
      <ReviewCardSkeleton />
      <ReviewCardSkeleton />
    </div>
  );
}

export default function FeedLoadingSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading feed"
      className="flex h-full min-h-0 flex-col"
    >
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 sm:gap-6 lg:hidden">
        <div className="flex flex-col gap-2.5">
          <div className="min-w-0">
            <FeedSearchSkeleton />
          </div>
          <FeedControlsSkeleton fullWidth />
        </div>

        <div className="flex flex-col gap-4">
          <FeedStarterLayerSkeleton />
          <FeedReviewStackSkeleton />
        </div>
      </section>

      <section className="hidden lg:block">
        <div className="mx-auto w-full max-w-[75rem]">
          <div className="mx-auto grid w-full gap-5 lg:grid-cols-[minmax(0,42rem)_17rem] lg:justify-center">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <FeedSearchSkeleton />
                </div>
                <div className="justify-self-start lg:justify-self-end">
                  <FeedControlsSkeleton />
                </div>
              </div>

              <FeedStarterLayerSkeleton />
              <FeedReviewStackSkeleton />
            </div>

            <WhoToFollowRailSkeleton />
          </div>
        </div>
      </section>
    </div>
  );
}
