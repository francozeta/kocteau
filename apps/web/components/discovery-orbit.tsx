"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ImageSphere } from "@/lib/discovery/image-sphere";
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

type SphereDisplayItem = DiscoveryOrbitItem & {
  coverUrl: string;
};

type DiscoveryOrbitProps = {
  seed?: DiscoveryOrbitItem | null;
  items: DiscoveryOrbitItem[];
  centerSeed?: boolean;
  onSelect: (item: DiscoveryOrbitItem) => void;
};

function getArtistLabel(item: SphereDisplayItem) {
  return item.type === "artist"
    ? "Artist"
    : item.artistName || "Unknown artist";
}

export default function DiscoveryOrbit({
  seed = null,
  items,
  centerSeed = false,
  onSelect,
}: DiscoveryOrbitProps) {
  const isMobile = useIsMobile();
  const hostRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<ImageSphere | null>(null);
  const [canvasUnavailable, setCanvasUnavailable] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const sphereItems = useMemo(() => {
    const combined: SphereDisplayItem[] = [
      ...(seed?.coverUrl
        ? [
            {
              ...seed,
              coverUrl: seed.coverUrl,
              routeLabel: "Starting from",
              reason: "Choose another cover to explore a new branch.",
            },
          ]
        : []),
      ...items.flatMap((item) =>
        item.coverUrl ? [{ ...item, coverUrl: item.coverUrl }] : [],
      ),
    ];
    const seenCovers = new Set<string>();

    return combined
      .filter((item) => {
        const key = item.coverUrl.split("?")[0]?.toLowerCase();

        if (!key || seenCovers.has(key)) {
          return false;
        }

        seenCovers.add(key);
        return true;
      })
      .slice(0, isMobile ? 16 : 30);
  }, [isMobile, items, seed]);
  const imageUrls = useMemo(
    () => sphereItems.map((item) => item.coverUrl),
    [sphereItems],
  );
  const sphereItemsRef = useRef(sphereItems);
  const imageUrlsRef = useRef(imageUrls);
  const centerSeedRef = useRef(centerSeed);
  const seedRef = useRef(seed);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    sphereItemsRef.current = sphereItems;
    imageUrlsRef.current = imageUrls;
    centerSeedRef.current = centerSeed;
    seedRef.current = seed;
    onSelectRef.current = onSelect;
  }, [centerSeed, imageUrls, onSelect, seed, sphereItems]);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    let disposed = false;
    let sphere: ImageSphere | null = null;
    let onScreen = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? false;

        if (onScreen && !document.hidden) {
          sphere?.start();
        } else {
          sphere?.stop();
        }
      },
      { threshold: 0.08 },
    );
    const onVisibilityChange = () => {
      if (document.hidden || !onScreen) {
        sphere?.stop();
      } else {
        sphere?.start();
      }
    };

    observer.observe(host);
    document.addEventListener("visibilitychange", onVisibilityChange);

    void import("@/lib/discovery/image-sphere")
      .then(({ ImageSphere }) => {
        if (disposed) {
          return;
        }

        const compactViewport = host.clientWidth < 640;
        sphere = new ImageSphere(host, imageUrlsRef.current, {
          distance: compactViewport ? 590 : 545,
          fov: compactViewport ? 29 : 25,
          autoRotate: !reducedMotion.matches,
          reducedMotion: reducedMotion.matches,
          anchorIndex: centerSeedRef.current && seedRef.current ? 0 : undefined,
          onHoverChange: (index, position) => {
            setHoveredIndex(index);
            setHoverPosition(position ?? null);
          },
          onHoverMove: (position) => {
            if (tooltipRef.current) {
              tooltipRef.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translateX(-50%)`;
            }
          },
          onSelect: (index) => {
            const item = sphereItemsRef.current[index];

            if (item) {
              onSelectRef.current(item);
            }
          },
        });
        sphereRef.current = sphere;

        if (onScreen && !document.hidden) {
          sphere.start();
        } else {
          sphere.renderStill();
        }
      })
      .catch(() => {
        if (!disposed) setCanvasUnavailable(true);
      });

    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sphere?.destroy();
      sphereRef.current = null;
    };
  }, []);

  useEffect(() => {
    sphereRef.current?.updateImages(imageUrls, {
      anchorIndex: centerSeed && seed ? 0 : undefined,
    });
  }, [centerSeed, imageUrls, seed]);

  const hoveredItem =
    hoveredIndex !== null ? (sphereItems[hoveredIndex] ?? null) : null;

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div
        ref={hostRef}
        className="relative h-full min-h-0 overflow-hidden bg-transparent"
        aria-label="A draggable 3D sphere of music covers"
      >
        <div
          aria-label="Music covers in this discovery map"
          className={
            canvasUnavailable
              ? "grid max-h-full grid-cols-2 gap-3 overflow-y-auto p-4 pb-28 pt-32 sm:grid-cols-3"
              : undefined
          }
        >
          {sphereItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelect(item)}
              className={
                canvasUnavailable
                  ? "min-h-11 rounded-md bg-[var(--kocteau-surface-control)] p-3 text-start text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  : "sr-only focus:not-sr-only focus:fixed focus:bottom-20 focus:left-1/2 focus:z-[100002] focus:flex focus:min-h-11 focus:max-w-[calc(100%-2rem)] focus:-translate-x-1/2 focus:items-center focus:rounded-full focus:bg-black focus:px-4 focus:font-pixel focus:text-xs focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/80 md:focus:absolute md:focus:bottom-5"
              }
            >
              {item.title} by {getArtistLabel(item)} — {item.routeLabel}
            </button>
          ))}
        </div>

        {hoveredItem ? (
          <div
            ref={tooltipRef}
            style={
              hoverPosition
                ? {
                    transform: `translate3d(${hoverPosition.x}px, ${hoverPosition.y}px, 0) translateX(-50%)`,
                  }
                : undefined
            }
            className="pointer-events-none absolute left-0 top-0 z-30 max-w-44 rounded-[0.3rem] bg-black/78 px-2 py-1.5 text-center will-change-transform backdrop-blur-sm"
          >
            <p className="truncate font-pixel text-[10px] leading-tight text-foreground/90">
              {hoveredItem.title}
            </p>
            <p className="mt-0.5 truncate text-[9px] leading-tight text-muted-foreground/68">
              {getArtistLabel(hoveredItem)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
