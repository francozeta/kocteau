"use client";

import { useMemo, useState } from "react";
import EntityCoverImage from "@/components/music/entity-cover-image";
import type { DiscoveryOrbitItem } from "@/components/discovery/discovery-orbit";
import { cn } from "@/lib/utils";

type GalleryView = "curated" | "alphabetical" | "artists";
type DiscoveryInitialGridProps = {
  items: DiscoveryOrbitItem[];
  onSelect: (item: DiscoveryOrbitItem) => void;
};

const views: { id: GalleryView; label: string }[] = [
  { id: "curated", label: "Curated" },
  { id: "alphabetical", label: "A–Z" },
  { id: "artists", label: "By artist" },
];

function uniqueArtwork(items: DiscoveryOrbitItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const cover = item.coverUrl?.split("?")[0]?.toLowerCase();
    if (!cover || seen.has(cover)) return false;
    seen.add(cover);
    return true;
  });
}

function AlbumTile({
  item, index, byArtist, onSelect,
}: {
  item: DiscoveryOrbitItem;
  index: number;
  byArtist: boolean;
  onSelect: (item: DiscoveryOrbitItem) => void;
}) {
  // Vary the presentation ratio without cropping the original cover artwork.
  const portrait = index % 7 === 1 || index % 11 === 7;
  const landscape = !portrait && index % 9 === 4;
  const framed = portrait || landscape;
  const artist = item.artistName || "Unknown artist";

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={"Explore music from " + item.title + " by " + artist}
      className="group mb-3 block w-full break-inside-avoid text-left outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={cn(
          "relative isolate w-full overflow-hidden rounded-lg bg-foreground/[0.045] ring-1 ring-inset ring-foreground/[0.055]",
          "transition-[filter,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:brightness-110 group-active:scale-[0.985] motion-reduce:transition-none",
          portrait ? "aspect-[4/5]" : landscape ? "aspect-[5/4]" : "aspect-square",
        )}
      >
        {framed ? (
          <>
            <EntityCoverImage
              src={item.coverUrl}
              alt=""
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              variant="card"
              className="absolute inset-0 h-full w-full scale-125 opacity-55 blur-[30px]"
            />
            <div className="absolute inset-0 bg-black/20" />
            <EntityCoverImage
              src={item.coverUrl}
              alt=""
              sizes="(max-width: 640px) 40vw, (max-width: 1024px) 27vw, 21vw"
              priority={index < 3}
              variant="card"
              className={cn(
                "absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 shadow-[0_7px_25px_rgba(0,0,0,0.22)]",
                portrait ? "w-[87%]" : "w-[68%]",
              )}
            />
          </>
        ) : (
          <EntityCoverImage
            src={item.coverUrl}
            alt=""
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={index < 3}
            variant="card"
            className="h-full w-full"
          />
        )}
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/75 text-sm text-foreground opacity-0 backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          ↗
        </span>
      </div>
      <div className="mt-2 min-w-0 px-0.5">
        <span className="block truncate text-[12px] font-medium leading-[1.35] text-foreground/90">
          {byArtist ? artist : item.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-[1.35] text-muted-foreground/70">
          {byArtist ? item.title : artist}
        </span>
      </div>
    </button>
  );
}

// Recent-inspired dense masonry, connected to Kocteau's real discovery canvas.
export default function DiscoveryInitialGrid({
  items,
  onSelect,
}: DiscoveryInitialGridProps) {
  const [view, setView] = useState<GalleryView>("curated");
  const covers = useMemo(() => uniqueArtwork(items), [items]);
  const visible = useMemo(() => {
    if (view === "alphabetical") {
      return [...covers].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
    }
    if (view === "artists") {
      const artists = new Set<string>();
      return covers.filter((item) => {
        const artist = item.artistName?.trim().toLowerCase() || item.id;
        if (artists.has(artist)) return false;
        artists.add(artist);
        return true;
      });
    }
    return covers;
  }, [covers, view]);

  return (
    <div
      role="region"
      aria-label="Discover music"
      data-discovery-initial-grid=""
      data-gallery-reference="recent"
      className="no-scrollbar h-full min-h-0 overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto w-full max-w-[1520px] px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+5rem)] sm:px-5 md:pb-16 md:pt-7 lg:px-6">
        <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-[16px] font-medium leading-[1.4] tracking-[-0.02em] text-foreground">
            Discover
          </h3>
          <p className="text-[12px] leading-[1.4] text-muted-foreground/65">
            Music worth getting lost in.
          </p>
        </header>

        <div className="sticky top-0 z-20 -mx-1 mb-4 flex min-h-11 items-center justify-between gap-3 bg-background/90 px-1 py-2 backdrop-blur-xl">
          <div
            role="group"
            aria-label="Arrange discovery picks"
            className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto"
          >
            {views.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={view === option.id}
                onClick={() => setView(option.id)}
                className={cn(
                  "min-h-9 shrink-0 rounded-full px-3.5 text-[12px] font-medium outline-none transition-[background-color,color] duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                  view === option.id
                    ? "bg-foreground text-background"
                    : "bg-foreground/[0.055] text-muted-foreground hover:bg-foreground/[0.09] hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/60">
            {visible.length} {view === "artists" ? "artists" : "covers"}
          </span>
        </div>

        {visible.length > 0 ? (
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 2xl:columns-5">
            {visible.map((item, index) => (
              <AlbumTile
                key={item.id}
                item={item}
                index={index}
                byArtist={view === "artists"}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <p className="pt-12 text-[13px] text-muted-foreground">
            Search for music to start exploring.
          </p>
        )}
      </div>
    </div>
  );
}
