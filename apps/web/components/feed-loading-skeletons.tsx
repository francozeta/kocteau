import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ReviewCardSkeletonProps = {
  featured?: boolean;
  showEyebrow?: boolean;
};

type FeedControlsSkeletonProps = {
  compact?: boolean;
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

function FooterActionSkeleton() {
  return (
    <div className="flex h-8 items-center gap-1.5 rounded-full px-1.5">
      <Skeleton className="size-6 rounded-full bg-muted-foreground/[0.1]" />
      <SkeletonLine className="h-2.5 w-5 bg-muted-foreground/[0.09]" />
    </div>
  );
}

export function FeedSearchSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-11 w-full items-center gap-3 rounded-lg border border-border/42 bg-card/42 px-3.5"
    >
      <Skeleton className="size-4 shrink-0 rounded-full bg-muted-foreground/[0.15]" />
      <SkeletonLine className="h-3.5 w-[min(18rem,72%)] bg-muted-foreground/[0.12]" />
    </div>
  );
}

export function FeedControlsSkeleton({
  compact = false,
}: FeedControlsSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className="inline-flex items-center rounded-lg border border-border/42 bg-card/38 p-1"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`feed-control-${index}`}
          className={cn(
            "flex h-9 items-center justify-center rounded-md",
            compact ? "w-9" : "w-[4.85rem]",
            index === 0 && "border border-border/48 bg-background",
          )}
        >
          <Skeleton
            className={cn(
              "rounded-full bg-muted-foreground/[0.12]",
              compact ? "size-4" : "h-3 w-10",
              index === 0 && "bg-muted-foreground/[0.18]",
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
        "overflow-hidden rounded-lg border border-border/40 bg-card/44 md:border-border/32 md:bg-card/34",
        featured && "border-border/48 bg-card/54 md:border-border/36 md:bg-card/42",
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-[1.125rem]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            {showEyebrow ? (
              <SkeletonLine className="h-2.5 w-28 bg-muted-foreground/[0.09]" />
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="size-6 rounded-full bg-muted-foreground/[0.15]" />
              <SkeletonLine className="h-3.5 w-24 bg-muted-foreground/[0.14]" />
              <Skeleton className="size-1 rounded-full bg-muted-foreground/[0.08]" />
              <SkeletonLine className="h-3 w-20 bg-muted-foreground/[0.1]" />
            </div>
          </div>

          <div className="flex h-8 w-[4.4rem] items-center gap-1.5 self-start rounded-lg border border-border/38 bg-muted-foreground/[0.08] px-2.5 py-1">
            <Skeleton className="size-3.5 rounded-full bg-muted-foreground/[0.15]" />
            <SkeletonLine className="h-3 w-7 bg-muted-foreground/[0.12]" />
          </div>
        </div>

        <div className="-mx-1 flex items-center gap-3 rounded-lg px-1 py-1.5">
          <Skeleton className="size-11 shrink-0 rounded-md border border-border/34 bg-muted-foreground/[0.12] md:border-border/28 md:bg-muted-foreground/[0.09]" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <SkeletonLine className="h-4 w-[min(18rem,82%)] bg-muted-foreground/[0.15]" />
            <SkeletonLine className="h-3 w-[min(11rem,54%)] bg-muted-foreground/[0.1]" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <SkeletonLine className="h-5 w-[min(24rem,86%)] bg-muted-foreground/[0.18]" />
          <SkeletonLine className="h-5 w-[min(17rem,62%)] bg-muted-foreground/[0.12]" />
        </div>

        <div className="flex flex-col gap-2">
          <SkeletonLine className="h-3.5 w-full bg-muted-foreground/[0.11]" />
          <SkeletonLine className="h-3.5 w-[94%] bg-muted-foreground/[0.1]" />
          <SkeletonLine className="h-3.5 w-[76%] bg-muted-foreground/[0.08]" />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/24 pt-2.5 md:border-border/18">
          <div className="flex items-center gap-0.5">
            <FooterActionSkeleton />
            <FooterActionSkeleton />
            <FooterActionSkeleton />
          </div>
          <Skeleton className="hidden h-7 w-7 rounded-full bg-muted-foreground/[0.06] sm:block" />
        </div>
      </div>
    </article>
  );
}

function StarterQueueItemSkeleton({ index }: { index: number }) {
  return (
    <div className="grid min-h-[4.75rem] grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2 p-2.5">
      <Skeleton className="size-12 rounded-md border border-border/20 bg-muted-foreground/[0.09]" />
      <div className="flex min-w-0 flex-col gap-2">
        <SkeletonLine
          className={cn(
            "h-3 bg-muted-foreground/[0.12]",
            index === 0 ? "w-24" : index === 1 ? "w-20" : "w-28",
          )}
        />
        <SkeletonLine
          className={cn(
            "h-2.5 bg-muted-foreground/[0.08]",
            index === 0 ? "w-16" : index === 1 ? "w-24" : "w-14",
          )}
        />
      </div>
      <Skeleton className="size-3 rounded-full bg-muted-foreground/[0.08]" />
    </div>
  );
}

export function FeedStarterLayerSkeleton() {
  return (
    <section aria-hidden="true" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-3.5 rounded-full bg-muted-foreground/[0.12]" />
            <SkeletonLine className="h-2.5 w-24 bg-muted-foreground/[0.09]" />
          </div>
          <SkeletonLine className="h-7 w-[min(17rem,82vw)] bg-muted-foreground/[0.15]" />
        </div>

        <div className="hidden items-center gap-1.5 sm:flex">
          <Skeleton className="h-1.5 w-7 rounded-full bg-muted-foreground/[0.18]" />
          <Skeleton className="h-1.5 w-3 rounded-full bg-muted-foreground/[0.09]" />
          <Skeleton className="h-1.5 w-3 rounded-full bg-muted-foreground/[0.09]" />
          <Skeleton className="h-1.5 w-3 rounded-full bg-muted-foreground/[0.06]" />
        </div>
      </div>

      <article className="overflow-hidden rounded-md border border-border/32 bg-card/24">
        <div className="grid gap-0 md:grid-cols-[9.5rem_minmax(0,1fr)] lg:grid-cols-[10.5rem_minmax(0,1fr)_13rem]">
          <div className="border-b border-border/24 p-3 md:border-r md:border-b-0">
            <Skeleton className="aspect-square w-full rounded-md border border-border/24 bg-muted-foreground/[0.08]" />
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-5 p-4">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3 rounded-full bg-muted-foreground/[0.09]" />
                <SkeletonLine className="h-2.5 w-32 bg-muted-foreground/[0.08]" />
              </div>
              <div className="flex flex-col gap-2">
                <SkeletonLine className="h-8 w-[min(22rem,92%)] bg-muted-foreground/[0.16]" />
                <SkeletonLine className="h-8 w-[min(14rem,62%)] bg-muted-foreground/[0.12]" />
              </div>
              <SkeletonLine className="h-3.5 w-40 bg-muted-foreground/[0.09]" />
              <div className="flex max-w-xl flex-col gap-2 pt-1">
                <SkeletonLine className="h-3.5 w-full bg-muted-foreground/[0.09]" />
                <SkeletonLine className="h-3.5 w-[86%] bg-muted-foreground/[0.08]" />
                <SkeletonLine className="h-3.5 w-[64%] bg-muted-foreground/[0.06]" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <SkeletonLine className="h-3 w-12 bg-muted-foreground/[0.08]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-[5.6rem] rounded-full border border-border/28 bg-background/18" />
                <Skeleton className="h-8 w-[5rem] rounded-full border border-border/42 bg-background/24" />
              </div>
            </div>
          </div>

          <div className="hidden min-w-0 border-l border-border/24 lg:block">
            <div className="border-b border-border/24 px-3 py-2">
              <SkeletonLine className="h-2.5 w-16 bg-muted-foreground/[0.08]" />
            </div>
            <div className="divide-y divide-border/20">
              {Array.from({ length: 3 }).map((_, index) => (
                <StarterQueueItemSkeleton
                  key={`starter-queue-${index}`}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function RailProfileSkeleton({ index }: { index: number }) {
  return (
    <div className="rounded-lg bg-card/44 p-3 ring-1 ring-border/25">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg bg-muted-foreground/[0.12]" />
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
        <Skeleton className="h-7 w-14 shrink-0 rounded-full border border-border/28 bg-muted-foreground/[0.07]" />
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
      <div className="flex flex-col gap-2">
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
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <FeedSearchSkeleton />
          </div>
          <div className="shrink-0">
            <FeedControlsSkeleton compact />
          </div>
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
              <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="min-w-0">
                  <FeedSearchSkeleton />
                </div>
                <div className="justify-self-start xl:justify-self-end">
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
