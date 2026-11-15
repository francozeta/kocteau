"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import {
  createGalleryRenderer,
  type GalleryScene,
} from "@/components/discovery/gallery-renderer";
import {
  getGalleryPose,
  getWheelPose,
  shortestDistance,
} from "@/lib/discovery/gallery-motion";
import DiscoveryCoverImage from "@/components/discovery/discovery-cover-image";
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

export default function DiscoveryOrbit({
  seed = null,
  items,
  onSelect,
}: DiscoveryOrbitProps) {
  const isMobile = useIsMobile();
  const galleryRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const rendererRef = useRef<ReturnType<typeof createGalleryRenderer> | null>(
    null,
  );
  const pointerRef = useRef<PointerStart | null>(null);
  const lastWheelRef = useRef(0);
  const suppressClickRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [viewport, setViewport] = useState({ width: 960, height: 640 });
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
    const deduped = combined
      .filter((item) => {
        const normalized = item.coverUrl.split("?")[0]?.toLowerCase();
        if (!normalized || covers.has(normalized)) return false;
        covers.add(normalized);
        return true;
      })
      .slice(0, isMobile ? 16 : 30);
    if (!seed) return deduped;
    const [focus, ...neighbors] = deduped;
    // Put the best six candidates nearest either side of the seed. A circular
    // gallery must not promote the tail of a ranked list into the first view.
    return [
      focus,
      ...neighbors.filter((_, index) => index % 2 === 0),
      ...neighbors.filter((_, index) => index % 2 === 1).reverse(),
    ].filter(Boolean);
  }, [isMobile, items, seed]);

  const context = seed?.id ?? "root";
  const remembered =
    focused.context === context
      ? galleryItems.findIndex((item) => item.id === focused.itemId)
      : -1;
  const activeIndex = remembered >= 0 ? remembered : 0;
  const activeItem = galleryItems[activeIndex];
  const composition = activeIndex % 2 === 1 ? "loose" : "constellation";
  const count = galleryItems.length;
  const hasItems = count > 0;
  const cardWidth = isMobile
    ? Math.min(viewport.width * 0.51, 218)
    : Math.min(Math.max(viewport.width * 0.235, 220), 338);

  useEffect(() => {
    const host = galleryRef.current;
    if (!host) return;
    const update = () => {
      const width = Math.round(host.clientWidth);
      const height = Math.round(host.clientHeight);
      if (width < 1 || height < 1) return;
      setViewport((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [hasItems]);

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

  const endPointer = (
    event: PointerEvent<HTMLDivElement>,
    cancelled = false,
  ) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    pointerRef.current = null;
    rendererRef.current?.setDrag(0);

    if (pointer.dragging) {
      setDragging(false);
      suppressClickRef.current = true;
      const delta = event.clientX - pointer.x;
      if (!cancelled && Math.abs(delta) >= 35) step(delta < 0 ? 1 : -1);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
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
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    if (count < 2 || Math.abs(delta) < 12) return;
    event.preventDefault();
    const now = Date.now();
    if (now - lastWheelRef.current < 280) return;
    lastWheelRef.current = now;
    step(delta > 0 ? 1 : -1);
  };

  const visible = useMemo(
    () =>
      galleryItems.flatMap((item, index) => {
        const distance = shortestDistance(index, activeIndex, count);
        if (Math.abs(distance) > 3 || (isMobile && distance === -3)) return [];
        return [{ item, index, distance }];
      }),
    [galleryItems, activeIndex, count, isMobile],
  );

  // Retain departing covers until the shared motion clock finishes their exit.
  // Comparing inputs during render keeps entering elements available before the
  // renderer receives its next targets, without an effect-driven extra frame.
  const [rendered, setRendered] = useState({
    source: visible,
    entries: visible,
  });
  if (rendered.source !== visible) {
    const incoming = new Set(visible.map(({ item }) => item.id));
    setRendered({
      source: visible,
      entries: [
        ...visible,
        ...rendered.entries.filter(({ item }) => !incoming.has(item.id)),
      ],
    });
  }
  const onRest = useCallback((ids: string[]) => {
    const completed = new Set(ids);
    setRendered((current) => {
      if (
        current.entries.length === current.source.length ||
        current.source.length !== completed.size ||
        current.source.some(({ item }) => !completed.has(item.id))
      )
        return current;
      return { source: current.source, entries: current.source };
    });
  }, []);

  const scene: GalleryScene = useMemo(
    () => ({
      ...viewport,
      mobile: isMobile,
      cardWidth,
      originId: seed?.id ?? activeItem?.id ?? null,
      nodes: visible.map(({ item, distance }) => {
        const pose = getGalleryPose(
          distance,
          isMobile,
          viewport,
          activeItem?.id ?? "root",
          composition,
        );
        return {
          id: item.id,
          pose,
          wheel:
            visible.length < 3
              ? pose
              : getWheelPose(distance, visible.length, isMobile, viewport),
        };
      }),
      connections: visible.flatMap(({ item, index }) => {
        if (seed && visible.some((node) => node.item.id === seed.id)) {
          return item.id === seed.id ? [] : [{ from: seed.id, to: item.id }];
        }
        const next = galleryItems[(index + 1) % count];
        return next &&
          next.id !== item.id &&
          (count !== 2 || index === 0) &&
          visible.some((node) => node.item.id === next.id)
          ? [{ from: item.id, to: next.id }]
          : [];
      }),
    }),
    [
      visible,
      viewport,
      cardWidth,
      isMobile,
      activeItem?.id,
      galleryItems,
      count,
      seed,
      composition,
    ],
  );

  useEffect(() => {
    const host = galleryRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const renderer = createGalleryRenderer(
      host,
      canvas,
      cardRefs.current,
      onRest,
    );
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [onRest, hasItems]);

  useEffect(() => {
    rendererRef.current?.setScene(scene);
  }, [scene]);

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
      data-gallery-composition={dragging ? "wheel" : composition}
      className="relative h-full min-h-0 touch-pan-y select-none overflow-hidden bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/70"
      onKeyDown={onGalleryKeyDown}
      onWheel={onGalleryWheel}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!event.isPrimary || pointerRef.current) return;
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
        const offset = Math.max(-115, Math.min(115, dx * 0.55));
        rendererRef.current?.setDrag(offset, true);
      }}
      onPointerUp={(event) => endPointer(event)}
      onPointerCancel={(event) => endPointer(event, true)}
      onLostPointerCapture={(event) => endPointer(event, true)}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
      }}
    >
      <div aria-live="polite" className="sr-only">
        {activeItem.title} by {getArtistLabel(activeItem)}. Cover{" "}
        {activeIndex + 1} of {count}. Select the centered cover to explore
        related music.
      </div>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-discovery-ink=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />

      {rendered.entries.map(({ item }) => {
        const present = visible.find((node) => node.item.id === item.id);
        const central = present?.distance === 0;
        const style: CSSProperties = {
          width: cardWidth,
          top: 0,
          left: 0,
          zIndex: central ? 10 : 5,
          opacity: 0,
          transformOrigin: `50% ${cardWidth / 2}px`,
          pointerEvents: present ? "auto" : "none",
        };
        return (
          <button
            type="button"
            key={item.id}
            ref={(element) => {
              if (element) cardRefs.current.set(item.id, element);
              else cardRefs.current.delete(item.id);
            }}
            data-discovery-gallery-card=""
            data-gallery-center={central ? "true" : "false"}
            aria-current={seed?.id === item.id ? "true" : undefined}
            aria-hidden={!present || undefined}
            aria-label={
              (central ? "Explore related music from " : "Center ") +
              item.title +
              " by " +
              getArtistLabel(item)
            }
            tabIndex={central ? 0 : -1}
            onClick={() => present && selectCard(item, present.distance)}
            style={style}
            className="absolute block min-w-0 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
          >
            <DiscoveryCoverImage
              src={item.coverUrl}
              sizes={isMobile ? "51vw" : "(max-width: 1024px) 24vw, 338px"}
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
