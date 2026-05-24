"use client";

import type { ReactNode } from "react";
import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink, { type QueryWarmupDescriptor } from "@/components/prefetch-link";
import { cn } from "@/lib/utils";

type TrackTileProps = {
  title: string;
  artistName?: string | null;
  coverUrl?: string | null;
  href?: string;
  queryWarmup?: QueryWarmupDescriptor | QueryWarmupDescriptor[];
  badge?: ReactNode;
  className?: string;
  coverClassName?: string;
  titleClassName?: string;
  artistClassName?: string;
  sizes?: string;
  quality?: number;
};

function TrackTileContent({
  title,
  artistName,
  coverUrl,
  badge,
  className,
  coverClassName,
  titleClassName,
  artistClassName,
  sizes = "(min-width: 1024px) 128px, 42vw",
  quality = 84,
}: Omit<TrackTileProps, "href" | "queryWarmup">) {
  return (
    <div className={cn("group min-w-0", className)}>
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-[0.68rem] bg-card/28 shadow-[0_0_0_1px_rgba(255,255,255,0.075)]",
          coverClassName,
        )}
      >
        <EntityCoverImage
          src={coverUrl}
          alt={title}
          sizes={sizes}
          quality={quality}
          variant="card"
          className="absolute inset-0 bg-muted/20"
          iconClassName="size-6"
        />
        {badge ? (
          <div className="absolute right-1.5 top-1.5 inline-flex h-7 items-center gap-1.5 rounded-[0.48rem] bg-black/48 px-2 text-xs font-semibold tabular-nums text-white ring-1 ring-white/10">
            {badge}
          </div>
        ) : null}
      </div>

      <div className="mt-2 min-w-0 space-y-0.5 px-0.5">
        <p className={cn("line-clamp-1 text-sm font-semibold text-foreground", titleClassName)}>
          {title}
        </p>
        <p className={cn("line-clamp-1 text-xs text-muted-foreground", artistClassName)}>
          {artistName ?? "Unknown artist"}
        </p>
      </div>
    </div>
  );
}

export default function TrackTile({
  href,
  queryWarmup,
  ...props
}: TrackTileProps) {
  const tile = <TrackTileContent {...props} />;

  if (!href) {
    return tile;
  }

  return (
    <PrefetchLink
      href={href}
      queryWarmup={queryWarmup}
      className="block rounded-[0.72rem] outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {tile}
    </PrefetchLink>
  );
}
