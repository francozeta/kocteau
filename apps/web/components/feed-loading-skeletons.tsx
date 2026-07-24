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

function SkeletonLine({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("h-3 rounded-full bg-muted-foreground/[0.11]", className)}
    />
  );
}

export function FeedSearchSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="kocteau-control-surface flex h-10 w-full items-center gap-3 rounded-[var(--kocteau-radius-control)] px-3.5"
    >
      <Skeleton className="size-3.5 shrink-0 rounded-full bg-muted-foreground/[0.1]" />
      <SkeletonLine className="w-[min(15rem,62%)]" />
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
        "flex h-9 items-center gap-7",
        fullWidth ? "w-full" : "w-full max-w-[17.25rem]",
      )}
    >
      <SkeletonLine className="h-4 w-14 bg-muted-foreground/[0.16]" />
      <SkeletonLine className="h-4 w-16" />
      <SkeletonLine className="h-4 w-10" />
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
        "py-3",
        featured && "rounded-[var(--kocteau-radius-card)] bg-card/[0.08] px-3",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-7 shrink-0 rounded-full bg-muted-foreground/[0.11]" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SkeletonLine className="h-3.5 w-24 bg-muted-foreground/[0.14]" />
          {showEyebrow ? <SkeletonLine className="h-3 w-14" /> : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
        <Skeleton className="aspect-square w-full rounded-[0.78rem] bg-muted-foreground/[0.1]" />
        <div className="min-w-0 space-y-3">
          <SkeletonLine className="h-6 w-[min(18rem,86%)] bg-muted-foreground/[0.16]" />
          <SkeletonLine className="h-3.5 w-[min(11rem,58%)]" />
          <div className="space-y-2 pt-2">
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-[72%] bg-muted-foreground/[0.08]" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function FeedStarterLayerSkeleton() {
  return (
    <section aria-hidden="true" className="space-y-4">
      <SkeletonLine className="h-5 w-40 bg-muted-foreground/[0.14]" />
      <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-4 rounded-[var(--kocteau-radius-card)] bg-card/[0.1] p-3">
        <Skeleton className="aspect-square rounded-[0.75rem] bg-muted-foreground/[0.1]" />
        <div className="space-y-3">
          <SkeletonLine className="h-6 w-[72%] bg-muted-foreground/[0.15]" />
          <SkeletonLine className="w-[46%]" />
        </div>
      </div>
    </section>
  );
}

export function WhoToFollowRailSkeleton({
  showHeading = true,
}: WhoToFollowRailSkeletonProps = {}) {
  const content = (
    <>
      {showHeading ? <SkeletonLine className="w-28" /> : null}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`rail-profile-${index}`} className="flex items-center gap-2.5">
            <Skeleton className="size-8 shrink-0 rounded-full bg-muted-foreground/[0.1]" />
            <SkeletonLine className={index === 1 ? "w-20" : "w-24"} />
          </div>
        ))}
      </div>
    </>
  );

  if (!showHeading) {
    return content;
  }

  return <aside className="hidden flex-col gap-4 lg:flex">{content}</aside>;
}

export function FeedReviewStackSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <ReviewCardSkeleton />
      <ReviewCardSkeleton />
    </div>
  );
}

export default function FeedLoadingSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading feed"
      className="flex w-full flex-col gap-5"
    >
      <FeedControlsSkeleton fullWidth />
      <FeedReviewStackSkeleton />
    </section>
  );
}
