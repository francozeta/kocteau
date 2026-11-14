"use client";

import EntityCoverImage from "@/components/music/entity-cover-image";
import type { DiscoveryOrbitItem } from "@/components/discovery/discovery-orbit";

type DiscoveryInitialGridProps = {
  items: DiscoveryOrbitItem[];
  onSelect: (item: DiscoveryOrbitItem) => void;
};

// The first Search frame is for scanning covers. Keep each artwork once, even
// when editorial starter tracks share an album, and leave selection to the
// existing discovery canvas so Back restores this frame.
export default function DiscoveryInitialGrid({
  items,
  onSelect,
}: DiscoveryInitialGridProps) {
  const knownCovers = new Set<string>();
  const covers = items.filter((item) => {
    if (!item.coverUrl) return false;
    const key = item.coverUrl.split("?")[0]?.toLowerCase();
    if (!key || knownCovers.has(key)) return false;
    knownCovers.add(key);
    return true;
  });

  return (
    <div
      role="region"
      aria-label="Discover music"
      data-discovery-initial-grid=""
      className="no-scrollbar h-full min-h-0 overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto w-full max-w-[1160px] px-5 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+5.25rem)] sm:px-7 md:pb-16 md:pt-8 lg:px-10">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div className="min-w-0">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.17em] text-muted-foreground/65">
              A place to begin
            </p>
            <h3 className="font-pixel text-[22px] font-medium leading-tight tracking-[-0.03em] text-foreground sm:text-[26px]">
              Discover
            </h3>
          </div>
          {covers.length > 0 ? (
            <span className="shrink-0 pb-1 text-[11px] tabular-nums text-muted-foreground/55">
              {covers.length} picks
            </span>
          ) : null}
        </div>

        {covers.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-7 lg:grid-cols-5 xl:grid-cols-6">
            {covers.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                aria-label={`Explore music from ${item.title} by ${item.artistName || "Unknown artist"}`}
                className="group block min-w-0 rounded-[0.6rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              >
                <EntityCoverImage
                  src={item.coverUrl}
                  alt=""
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, (max-width: 1280px) 19vw, 175px"
                  priority={index < 4}
                  variant="card"
                  className="aspect-square w-full rounded-[0.6rem] bg-foreground/[0.035] ring-1 ring-inset ring-white/[0.075] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)] group-active:scale-[0.975] motion-reduce:transition-none"
                />
                <span className="mt-2.5 block truncate font-pixel text-[12px] font-medium leading-[1.35] text-foreground/90 sm:text-[13px]">
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] leading-[1.45] text-muted-foreground/70">
                  {item.artistName || "Unknown artist"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="pt-12 text-sm text-muted-foreground">
            Search for music to start exploring.
          </p>
        )}
      </div>
    </div>
  );
}
