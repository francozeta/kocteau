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

function getArtistLabel(item: Pick<DiscoveryOrbitItem, "type" | "artistName">) {
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
  const labelRefs = useRef(new Map<string, HTMLDivElement>());
  const sphereRef = useRef<ImageSphere | null>(null);
  const [canvasUnavailable, setCanvasUnavailable] = useState(false);
  const sphereItems = useMemo(() => {
    const combined: SphereDisplayItem[] = [
      ...(seed?.coverUrl
        ? [
            {
              ...seed,
              coverUrl: seed.coverUrl,
              routeLabel: "Current music",
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
          onCoverPosition: (imageUrl, x, y, opacity, visible) => {
            const label = labelRefs.current.get(imageUrl);

            if (!label) return;

            label.style.transform = `translate3d(${x}px, ${y}px, 0) translateX(-50%)`;
            label.style.opacity = visible ? String(Math.max(0.55, opacity)) : "0";
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

  useEffect(() => {
    const labels = hostRef.current?.querySelectorAll<HTMLDivElement>(
      "[data-discovery-cover-label]",
    );
    labelRefs.current.clear();
    labels?.forEach((label) => {
      const imageUrl = label.dataset.coverUrl;
      if (imageUrl) labelRefs.current.set(imageUrl, label);
    });
  }, [sphereItems]);

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
              aria-current={seed?.id === item.id ? "true" : undefined}
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

        {!canvasUnavailable
          ? sphereItems.map((item) => (
              <div
                key={item.id}
                data-discovery-cover-label
                data-cover-url={item.coverUrl}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 z-10 w-32 text-center opacity-0 [text-shadow:0_1px_4px_#000] md:w-40"
              >
                <span className="block truncate text-[10px] font-medium leading-tight text-foreground/90">
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate text-[9px] leading-tight text-muted-foreground/75">
                  {getArtistLabel(item)}
                </span>
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
