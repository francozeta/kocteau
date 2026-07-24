import type { ReactNode } from "react";

import {
  FeedSearchSkeleton,
  ReviewCardSkeleton,
} from "@/components/feed-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("h-3 rounded-full bg-muted-foreground/[0.11]", className)}
    />
  );
}

function PageHeadingSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <header aria-hidden="true" className="space-y-3">
      <SkeletonLine
        className={cn(
          "bg-muted-foreground/[0.16]",
          compact ? "h-7 w-36" : "h-9 w-[min(22rem,68%)]",
        )}
      />
      <SkeletonLine className="w-[min(30rem,82%)]" />
    </header>
  );
}

function ListRowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="space-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`route-row-${index}`} className="flex items-center gap-3.5">
          <Skeleton className="size-12 shrink-0 rounded-[0.65rem] bg-muted-foreground/[0.1]" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className={index % 2 === 0 ? "w-[44%]" : "w-[58%]"} />
            <SkeletonLine className="w-[30%] bg-muted-foreground/[0.07]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TileGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`route-tile-${index}`} className="space-y-2.5">
          <Skeleton className="aspect-square rounded-[0.8rem] bg-muted-foreground/[0.1]" />
          <SkeletonLine className="w-[74%]" />
        </div>
      ))}
    </div>
  );
}

function LoadingSection({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-busy="true"
      aria-label={label}
      className={cn("flex w-full flex-col gap-8", className)}
    >
      {children}
    </section>
  );
}

export function SearchPageLoadingSkeleton() {
  return (
    <LoadingSection label="Loading search" className="max-w-5xl">
      <FeedSearchSkeleton />
      <ListRowsSkeleton />
    </LoadingSection>
  );
}

export function LibraryPageLoadingSkeleton() {
  return (
    <LoadingSection label="Loading library" className="max-w-5xl">
      <PageHeadingSkeleton />
      <TileGridSkeleton />
    </LoadingSection>
  );
}

export function AtlasPageLoadingSkeleton() {
  return (
    <LoadingSection label="Loading Atlas" className="max-w-5xl">
      <PageHeadingSkeleton />
      <ListRowsSkeleton />
    </LoadingSection>
  );
}

export function ReviewsPageLoadingSkeleton() {
  return (
    <LoadingSection label="Loading reviews" className="max-w-3xl gap-6">
      <PageHeadingSkeleton compact />
      <ReviewCardSkeleton />
      <ReviewCardSkeleton />
    </LoadingSection>
  );
}

export function ActivityPageLoadingSkeleton() {
  return (
    <LoadingSection label="Loading activity" className="max-w-3xl">
      <PageHeadingSkeleton compact />
      <ListRowsSkeleton count={4} />
    </LoadingSection>
  );
}

export function TracksPageLoadingSkeleton() {
  return (
    <LoadingSection label="Loading tracks" className="max-w-6xl">
      <PageHeadingSkeleton />
      <ListRowsSkeleton count={4} />
    </LoadingSection>
  );
}

export function ReviewPageLoadingSkeleton() {
  return (
    <LoadingSection label="Loading review" className="max-w-3xl">
      <ReviewCardSkeleton />
    </LoadingSection>
  );
}

export function TrackPageLoadingSkeleton() {
  return (
    <LoadingSection label="Loading track" className="max-w-6xl gap-7">
      <div aria-hidden="true" className="grid gap-5 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center">
        <Skeleton className="mx-auto size-[min(54vw,10rem)] rounded-[1rem] bg-muted-foreground/[0.1] md:mx-0" />
        <div className="space-y-3">
          <SkeletonLine className="h-9 w-[min(26rem,82%)] bg-muted-foreground/[0.17]" />
          <SkeletonLine className="w-40" />
          <SkeletonLine className="w-56 bg-muted-foreground/[0.08]" />
        </div>
      </div>
      <ReviewCardSkeleton />
    </LoadingSection>
  );
}

export function ProfilePageLoadingSkeleton() {
  return (
    <LoadingSection label="Loading profile" className="max-w-6xl gap-7">
      <div aria-hidden="true" className="flex items-center gap-4">
        <Skeleton className="size-20 shrink-0 rounded-full bg-muted-foreground/[0.11]" />
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonLine className="h-7 w-[min(15rem,54%)] bg-muted-foreground/[0.16]" />
          <SkeletonLine className="w-[min(22rem,72%)]" />
        </div>
      </div>
      <TileGridSkeleton count={4} />
      <ReviewCardSkeleton />
    </LoadingSection>
  );
}
