"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ImageSphere } from "@/lib/discovery/image-sphere";
import type { CoverBounds } from "@/lib/discovery/cover-layout";
import type { SearchEntityType } from "@/lib/search-types";
import { cn } from "@/lib/utils";

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
  const labelSizesRef = useRef(
    new Map<string, { width: number; height: number }>(),
  );
  const labelInsetsRef = useRef({ top: 80, bottom: 112 });
  const labelObstaclesRef = useRef<CoverBounds[]>([]);
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
    const mobileLabels = window.matchMedia("(max-width: 767px)");
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
          anchorIndex:
            centerSeedRef.current && seedRef.current?.coverUrl ? 0 : undefined,
          getLabelSize: (imageUrl) => labelSizesRef.current.get(imageUrl),
          getLabelObstacles: () => labelObstaclesRef.current,
          getLabelInsets: () =>
            mobileLabels.matches
              ? labelInsetsRef.current
              : { top: 0, bottom: 0 },
          onCoverPosition: ({
            imageUrl,
            x,
            y,
            opacity,
            visible,
            coverWidth,
            placement,
          }) => {
            const label = labelRefs.current.get(imageUrl);

            if (!label) return;

            label.style.transform = `translate3d(${x}px, ${y}px, 0) translateX(-50%)`;
            label.style.setProperty(
              "--discovery-cover-width",
              `${coverWidth}px`,
            );
            label.style.opacity = visible
              ? String(Math.max(0.8, opacity))
              : "0";
            label.dataset.visible = String(visible);
            label.dataset.placement = placement;
            label.style.textAlign =
              label.dataset.current === "true" || placement === "right"
                ? "start"
                : placement === "left"
                  ? "end"
                  : "center";
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
      anchorIndex: centerSeed && seed?.coverUrl ? 0 : undefined,
    });
  }, [centerSeed, imageUrls, seed]);

  useEffect(() => {
    const labels = hostRef.current?.querySelectorAll<HTMLDivElement>(
      "[data-discovery-cover-label]",
    );
    const header = document.querySelector<HTMLElement>(
      "[data-kocteau-search-mobile-header-slot]",
    );
    const dock = document.getElementById("mobile-search-dock");
    const feedback = document.querySelector<HTMLElement>(
      "[data-discovery-feedback]",
    );
    const measureInsets = () => {
      const host = hostRef.current?.getBoundingClientRect();
      if (!host?.height) return;
      const headerBounds = header?.getBoundingClientRect();
      const dockBounds = dock?.getBoundingClientRect();
      labelObstaclesRef.current = Array.from(
        feedback?.querySelectorAll<HTMLElement>('[role="status"], button') ??
          [],
      ).flatMap((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 1 && bounds.height > 1
          ? [
              {
                left: bounds.left - host.left - 4,
                right: bounds.right - host.left + 4,
                top: bounds.top - host.top - 4,
                bottom: bounds.bottom - host.top + 4,
              },
            ]
          : [];
      });
      labelInsetsRef.current = {
        top: headerBounds?.height
          ? Math.max(64, headerBounds.bottom - host.top + 8)
          : 80,
        bottom: dockBounds?.height
          ? Math.max(0, host.bottom - dockBounds.top + 8)
          : 112,
      };
    };
    const observer = new ResizeObserver((entries) => {
      measureInsets();
      for (const entry of entries) {
        const imageUrl = (entry.target as HTMLDivElement).dataset.coverUrl;
        if (imageUrl)
          labelSizesRef.current.set(imageUrl, {
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
      }
    });
    labelRefs.current.clear();
    labelSizesRef.current.clear();
    measureInsets();
    for (const element of [
      hostRef.current,
      header,
      dock,
      feedback,
      feedback?.querySelector('[role="status"]'),
    ]) {
      if (element) observer.observe(element);
    }
    labels?.forEach((label) => {
      const imageUrl = label.dataset.coverUrl;
      if (imageUrl) {
        labelRefs.current.set(imageUrl, label);
        labelSizesRef.current.set(imageUrl, {
          width: label.offsetWidth,
          height: label.offsetHeight,
        });
        observer.observe(label);
      }
    });
    return () => observer.disconnect();
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
                data-current={seed?.id === item.id ? "true" : undefined}
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute left-0 top-0 max-w-[calc(100%-2rem)] opacity-0 [text-shadow:0_1px_4px_#000]",
                  seed?.id === item.id
                    ? "z-20 w-[min(14rem,var(--discovery-cover-width,14rem))] text-start"
                    : "z-10 w-32 text-center md:w-40",
                )}
              >
                <span
                  className={cn(
                    "block font-medium text-foreground",
                    seed?.id === item.id
                      ? "line-clamp-2 text-balance break-words text-sm leading-5"
                      : "truncate text-xs leading-4",
                  )}
                >
                  {seed?.id === item.id ? (
                    <span className="me-1 text-[11px] font-normal text-muted-foreground">
                      Exploring from
                    </span>
                  ) : null}
                  {item.title}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block truncate text-muted-foreground",
                    seed?.id === item.id
                      ? "text-xs leading-4"
                      : "text-[11px] leading-4",
                  )}
                >
                  {getArtistLabel(item)}
                </span>
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
