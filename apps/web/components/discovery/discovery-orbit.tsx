"use client";

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import EntityCoverImage from "@/components/music/entity-cover-image";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SearchEntityType } from "@/lib/search-types";

export type DiscoveryOrbitItem = {
  id: string;
  title: string;
  artistName: string | null;
  coverUrl: string | null;
  href: string;
  type: SearchEntityType;
  routeLabel: string;
  reason: string;
  providerId: string;
  entityId: string | null;
  artistProviderId: string | null;
};

type GalleryItem = DiscoveryOrbitItem & { coverUrl: string };

type DiscoveryOrbitProps = {
  seed?: DiscoveryOrbitItem | null;
  items: DiscoveryOrbitItem[];
  centerSeed?: boolean;
  onSelect: (item: DiscoveryOrbitItem) => void;
};

type PointerStart = {
  id: number;
  x: number;
  y: number;
  dragging: boolean;
};

function getArtistLabel(item: Pick<DiscoveryOrbitItem, "type" | "artistName">) {
  return item.type === "artist"
    ? "Artist"
    : item.artistName || "Unknown artist";
}

function shortestDistance(index: number, active: number, count: number) {
  const distance = (index - active + count) % count;
  return distance > count / 2 ? distance - count : distance;
}

/**
 * Gallery keeps Search's discovery data and actions unchanged. The former
 * WebGL sphere was only a renderer; CSS perspective makes five nearby covers
 * visible at a time without starting a continuous animation loop.
 */
export default function DiscoveryOrbit({
  seed = null,
  items,
  onSelect,
}: DiscoveryOrbitProps) {
  const isMobile = useIsMobile();
  const galleryRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerStart | null>(null);
  const lastWheelRef = useRef(0);
  const suppressClickRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState<{
    context: string;
    itemId: string | null;
  }>({ context: "root", itemId: null });

  const galleryItems = useMemo(() => {
    const combined: GalleryItem[] = [
      ...(seed?.coverUrl
        ? [{ ...seed, coverUrl: seed.coverUrl, routeLabel: "Current music" }]
        : []),
      ...items.flatMap((item) =>
        item.coverUrl ? [{ ...item, coverUrl: item.coverUrl }] : [],
      ),
    ];
    const covers = new Set<string>();
    return combined
      .filter((item) => {
        const normalized = item.coverUrl.split("?")[0]?.toLowerCase();
        if (!normalized || covers.has(normalized)) return false;
        covers.add(normalized);
        return true;
      })
      .slice(0, isMobile ? 16 : 30);
  }, [isMobile, items, seed]);

  const context = seed?.id ?? "root";
  const remembered = focused.context === context
    ? galleryItems.findIndex((item) => item.id === focused.itemId)
    : -1;
  const activeIndex = remembered >= 0 ? remembered : 0;
  const activeItem = galleryItems[activeIndex];
  const count = galleryItems.length;
  const spacing = isMobile ? 136 : 250;

  const focusAt = (index: number) => {
    if (!count) return;
    const next = (index + count) % count;
    setFocused({ context, itemId: galleryItems[next].id });
  };

  const step = (direction: number) => focusAt(activeIndex + direction);

  const selectCard = (item: GalleryItem, distance: number) => {
    if (distance !== 0) {
      focusAt(galleryItems.findIndex((candidate) => candidate.id === item.id));
      return;
    }
    if (seed?.id !== item.id) onSelect(item);
  };

  const endPointer = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    pointerRef.current = null;
    galleryRef.current?.style.setProperty("--kocteau-gallery-drag", "0px");
    if (pointer.dragging) {
      setDragging(false);
      suppressClickRef.current = true;
      const change = event.clientX - pointer.x;
      if (!cancelled && Math.abs(change) >= 35) step(change < 0 ? 1 : -1);
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onGalleryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!count) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(count - 1);
    }
  };

  const onGalleryWheel = (event: WheelEvent<HTMLDivElement>) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
    if (count < 2 || Math.abs(delta) < 12) return;
    event.preventDefault();
    const now = Date.now();
    if (now - lastWheelRef.current < 280) return;
    lastWheelRef.current = now;
    step(delta > 0 ? 1 : -1);
  };

  if (!count) return <div className="h-full" />;

  return (
    <div
      ref={galleryRef}
      role="region"
      aria-label="Music discovery gallery"
      aria-roledescription="carousel"
      tabIndex={0}
      data-discovery-gallery=""
      data-dragging={dragging ? "true" : "false"}
      className="relative h-full min-h-0 touch-pan-y select-none overflow-hidden bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/70"
      style={{ perspective: isMobile ? "1000px" : "1400px" }}
      onKeyDown={onGalleryKeyDown}
      onWheel={onGalleryWheel}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointerRef.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          dragging: false,
        };
      }}
      onPointerMove={(event) => {
        const pointer = pointerRef.current;
        if (!pointer || pointer.id !== event.pointerId) return;
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        if (!pointer.dragging) {
          if (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
          pointer.dragging = true;
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        const bounded = Math.max(-115, Math.min(115, dx * 0.55));
        event.currentTarget.style.setProperty(
          "--kocteau-gallery-drag",
          String(bounded) + "px",
        );
      }}
      onPointerUp={(event) => endPointer(event)}
      onPointerCancel={(event) => endPointer(event, true)}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
      }}
    >
      <div aria-live="polite" className="sr-only">
        {activeItem.title} by {getArtistLabel(activeItem)}.
        {" "}Cover {activeIndex + 1} of {count}.
        {" "}Select the centered cover to explore related music.
      </div>

      {galleryItems.map((item, index) => {
        const distance = shortestDistance(index, activeIndex, count);
        const depth = Math.abs(distance);
        if (depth > 2) return null;
        const central = distance === 0;
        const style: CSSProperties = {
          width: isMobile ? "min(47vw, 15rem)" : "clamp(13rem, 24vw, 21rem)",
          top: isMobile ? "47%" : "50%",
          left: "50%",
          zIndex: 10 - depth,
          opacity: central ? 1 : depth === 1 ? 0.68 : 0.32,
          transform:
            "translate3d(calc(-50% + " + (distance * spacing) +
            "px + var(--kocteau-gallery-drag, 0px)), -50%, " +
            (-depth * (isMobile ? 140 : 210)) + "px) " +
            "rotateY(" + (-distance * 49) + "deg) " +
            "scale(" + (1 - depth * 0.1) + ")",
          transition: dragging
            ? "none"
            : "transform 300ms var(--kocteau-ease), opacity 240ms var(--kocteau-ease)",
          backfaceVisibility: "hidden",
        };
        return (
          <button
            type="button"
            key={item.id}
            data-discovery-gallery-card=""
            data-gallery-center={central ? "true" : "false"}
            aria-current={seed?.id === item.id ? "true" : undefined}
            aria-label={
              (central ? "Explore related music from " : "Center ") +
              item.title + " by " + getArtistLabel(item)
            }
            tabIndex={central ? 0 : -1}
            onClick={() => selectCard(item, distance)}
            style={style}
            className="absolute block min-w-0 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/80 motion-reduce:!transition-none"
          >
            <EntityCoverImage
              src={item.coverUrl}
              alt=""
              sizes={isMobile ? "47vw" : "(max-width: 1024px) 24vw, 336px"}
              variant="card"
              className="aspect-square w-full rounded-[0.55rem] bg-foreground/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.36),0_20px_56px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-white/[0.08]"
            />
            <span className="mt-3 block max-w-full truncate font-pixel text-[12px] font-medium leading-tight text-foreground/90 sm:text-[13px]">
              {item.title}
            </span>
            <span className="mt-1 block max-w-full truncate text-[11px] leading-tight text-muted-foreground/75">
              {getArtistLabel(item)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
