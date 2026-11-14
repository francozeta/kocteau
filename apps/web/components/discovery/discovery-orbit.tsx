"use client";

import {
  useEffect,
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

type Point = { x: number; y: number };
type Layout = Point & {
  scale: number;
  rotateY: number;
  rotateZ: number;
  opacity: number;
  depth: number;
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

type SatelliteSlot = {
  x: number;
  y: number;
  scale: number;
  rotateY: number;
  rotateZ: number;
  opacity: number;
};

const DESKTOP_SLOTS: SatelliteSlot[] = [
  { x: 0.81, y: 0.29, scale: 0.68, rotateY: -24, rotateZ: 3, opacity: 0.76 },
  { x: 0.19, y: 0.30, scale: 0.64, rotateY: 27, rotateZ: -5, opacity: 0.72 },
  { x: 0.73, y: 0.76, scale: 0.59, rotateY: -22, rotateZ: -5, opacity: 0.57 },
  { x: 0.26, y: 0.74, scale: 0.60, rotateY: 19, rotateZ: 6, opacity: 0.60 },
  { x: 0.92, y: 0.52, scale: 0.51, rotateY: -37, rotateZ: 4, opacity: 0.45 },
  { x: 0.09, y: 0.55, scale: 0.49, rotateY: 39, rotateZ: -3, opacity: 0.40 },
];

const MOBILE_SLOTS: SatelliteSlot[] = [
  { x: 0.81, y: 0.29, scale: 0.62, rotateY: -23, rotateZ: 4, opacity: 0.70 },
  { x: 0.17, y: 0.30, scale: 0.62, rotateY: 23, rotateZ: -6, opacity: 0.67 },
  { x: 0.79, y: 0.73, scale: 0.55, rotateY: -22, rotateZ: -5, opacity: 0.50 },
  { x: 0.20, y: 0.72, scale: 0.59, rotateY: 18, rotateZ: 6, opacity: 0.54 },
  { x: 0.88, y: 0.52, scale: 0.47, rotateY: -31, rotateZ: 5, opacity: 0.35 },
];

// The slot shape stays recognizable; tiny item-based deviations make each
// discovery frame feel composed rather than random or symmetrical.
function hashUnit(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

function getLayout(
  distance: number,
  mobile: boolean,
  viewport: { width: number; height: number },
  activeId: string,
): Layout {
  const { width, height } = viewport;
  const centerX = width * 0.5;
  const centerY = height * (mobile ? 0.48 : 0.49);
  const depth = Math.abs(distance);

  if (depth === 0) {
    return {
      x: centerX,
      y: centerY,
      scale: 1,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1,
      depth: 0,
    };
  }

  const slotIndex =
    distance === 1 ? 0 :
    distance === -1 ? 1 :
    distance === 2 ? 2 :
    distance === -2 ? 3 :
    distance === 3 ? 4 : 5;
  const slots = mobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
  const slot = slots[slotIndex % slots.length];
  const deviationX = (hashUnit(activeId + ":" + slotIndex + ":x") - 0.5) * 0.057;
  const deviationY = (hashUnit(activeId + ":" + slotIndex + ":y") - 0.5) * 0.052;
  const deviationAngle = (hashUnit(activeId + ":" + slotIndex + ":r") - 0.5) * 7;

  return {
    x: width * (slot.x + deviationX),
    y: height * (slot.y + deviationY),
    scale: slot.scale,
    rotateY: slot.rotateY,
    rotateZ: slot.rotateZ + deviationAngle,
    opacity: slot.opacity,
    depth,
  };
}

// A narrow filled contour simulates pressure from an ink or pencil nib.
// Jitter is deterministic; no animation loop or per-frame random layout.
function inkTrace(from: Point, to: Point, salt: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const bend = (salt % 2 === 0 ? 1 : -1) * Math.min(32, length * 0.105);
  const control1 = {
    x: from.x + dx * 0.28 + nx * bend,
    y: from.y + dy * 0.28 + ny * bend,
  };
  const control2 = {
    x: from.x + dx * 0.7 + nx * bend * 0.6,
    y: from.y + dy * 0.7 + ny * bend * 0.6,
  };
  const left: Point[] = [];
  const right: Point[] = [];
  const center: Point[] = [];
  const count = 28;

  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const inv = 1 - t;
    const x =
      inv ** 3 * from.x +
      3 * inv ** 2 * t * control1.x +
      3 * inv * t ** 2 * control2.x +
      t ** 3 * to.x;
    const y =
      inv ** 3 * from.y +
      3 * inv ** 2 * t * control1.y +
      3 * inv * t ** 2 * control2.y +
      t ** 3 * to.y;
    const disturbance =
      Math.sin(t * 21 + salt * 1.7) * Math.sin(Math.PI * t) * 1.4;
    const pressure =
      (0.16 + 1.35 * Math.sin(Math.PI * t) ** 0.72) *
      (1 + 0.13 * Math.sin(t * 29 + salt));

    center.push({ x: x + nx * disturbance, y: y + ny * disturbance });
    left.push({
      x: x + nx * (disturbance + pressure),
      y: y + ny * (disturbance + pressure),
    });
    right.push({
      x: x + nx * (disturbance - pressure),
      y: y + ny * (disturbance - pressure),
    });
  }

  const serialize = (point: Point) =>
    point.x.toFixed(1) + " " + point.y.toFixed(1);
  const stroke =
    "M " +
    left.map(serialize).join(" L ") +
    " L " +
    right.reverse().map(serialize).join(" L ") +
    " Z";
  const line = "M " + center.map(serialize).join(" L ");
  return { stroke, line };
}

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
  const remembered =
    focused.context === context
      ? galleryItems.findIndex((item) => item.id === focused.itemId)
      : -1;
  const activeIndex = remembered >= 0 ? remembered : 0;
  const activeItem = galleryItems[activeIndex];
  const count = galleryItems.length;
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
  }, [count > 0]);

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

  const visible = galleryItems.flatMap((item, index) => {
    const distance = shortestDistance(index, activeIndex, count);
    if (Math.abs(distance) > 3 || (isMobile && distance === -3)) return [];
    return [
      {
        item,
        distance,
        layout: getLayout(distance, isMobile, viewport, activeItem.id),
      },
    ];
  });
  const center = getLayout(0, isMobile, viewport, activeItem?.id ?? "root");

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
      style={{ perspective: isMobile ? "1050px" : "1400px" }}
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
        const offset = Math.max(-115, Math.min(115, dx * 0.55));
        event.currentTarget.style.setProperty(
          "--kocteau-gallery-drag",
          offset + "px",
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

      <svg
        aria-hidden="true"
        viewBox={"0 0 " + viewport.width + " " + viewport.height}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible text-foreground"
        preserveAspectRatio="none"
        style={{ transform: "translateX(var(--kocteau-gallery-drag, 0px))" }}
      >
        {visible
          .filter(({ distance }) => distance !== 0)
          .map(({ item, distance, layout }, index) => {
            const depth = Math.abs(distance);
            const trace = inkTrace(
              center,
              layout,
              Math.round(hashUnit(activeItem.id + ":" + item.id) * 1000),
            );
            const delay = index * 65;
            return (
              <g
                key={context + ":" + activeItem.id + ":" + item.id}
                data-kocteau-trace-group=""
                style={{ animationDelay: delay + "ms" }}
              >
                <path
                  d={trace.stroke}
                  fill="currentColor"
                  opacity={depth === 1 ? 0.15 : depth === 2 ? 0.10 : 0.07}
                  data-kocteau-trace-ink=""
                />
                <path
                  d={trace.line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={depth === 1 ? 0.72 : 0.52}
                  strokeLinecap="round"
                  opacity={depth === 1 ? 0.38 : 0.22}
                  pathLength={1}
                  data-kocteau-trace-line=""
                  style={{ animationDelay: delay + "ms" }}
                />
                <path
                  d={trace.line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={depth === 1 ? 1.05 : 0.7}
                  strokeLinecap="round"
                  opacity={depth === 1 ? 0.24 : 0.12}
                  pathLength={1}
                  data-kocteau-trace-flow=""
                  style={{
                    animationDelay: (delay + 410) + "ms",
                    animationDuration: (4100 + index * 550) + "ms",
                  }}
                />
              </g>
            );
          })}
      </svg>

      {visible.map(({ item, distance, layout }) => {
        const central = distance === 0;
        const style: CSSProperties = {
          width: cardWidth,
          top: layout.y,
          left: layout.x,
          zIndex: 10 - layout.depth,
          opacity: layout.opacity,
          transform:
            "translate3d(calc(-50% + var(--kocteau-gallery-drag, 0px)), -50%, " +
            (-layout.depth * (isMobile ? 94 : 145)) +
            "px) rotateY(" +
            layout.rotateY +
            "deg) rotateZ(" +
            layout.rotateZ +
            "deg) scale(" +
            layout.scale +
            ")",
          transition: dragging
            ? "none"
            : "transform 340ms var(--kocteau-ease), left 340ms var(--kocteau-ease), top 340ms var(--kocteau-ease), opacity 260ms var(--kocteau-ease)",
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
              sizes={isMobile ? "51vw" : "(max-width: 1024px) 24vw, 338px"}
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
