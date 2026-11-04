"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ImageSphere } from "@/lib/discovery/image-sphere";
import type { SearchEntityType } from "@/lib/search-types";
import EntityCoverImage from "@/components/music/entity-cover-image";
import styles from "./discovery-interface.module.css";

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
  const selectedLabelRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<ImageSphere | null>(null);
  const [canvasUnavailable, setCanvasUnavailable] = useState(false);
  const [keyboardCover, setKeyboardCover] = useState<string | null>(null);
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
            const label = selectedLabelRef.current;

            if (!label || label.dataset.coverUrl !== imageUrl) return;

            label.style.transform = `translate3d(${x}px, ${y}px, 0) translateX(-50%)`;
            label.style.opacity = visible
              ? String(Math.max(0.55, opacity))
              : "0";
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

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div
        ref={hostRef}
        className="relative h-full min-h-0 overflow-hidden bg-transparent"
        role="group"
        aria-label="A draggable 3D sphere of music covers"
      >
        <div
          role="group"
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
              aria-label={`Select ${item.type === "track" ? "song" : item.type}: ${item.title}${item.artistName ? ` by ${item.artistName}` : ""}`}
              aria-current={seed?.id === item.id ? "true" : undefined}
              onClick={(event) => {
                onSelect(item);
                if (event.detail === 0) {
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLElement>("[data-discovery-focus]")
                      ?.focus({ preventScroll: true }),
                  );
                }
              }}
              onFocus={() => setKeyboardCover(item.id)}
              onBlur={() => setKeyboardCover(null)}
              className={
                canvasUnavailable
                  ? "min-h-11 rounded-md bg-[var(--kocteau-surface-control)] p-3 text-start text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  : styles.keyboardCover
              }
            >
              {canvasUnavailable || keyboardCover === item.id ? (
                <EntityCoverImage
                  src={item.coverUrl}
                  alt=""
                  sizes={canvasUnavailable ? "160px" : "44px"}
                  className={
                    canvasUnavailable
                      ? "aspect-square w-full rounded-md ring-1 ring-inset ring-white/10"
                      : "size-11 rounded-md"
                  }
                />
              ) : null}
              {canvasUnavailable && seed?.id === item.id ? (
                <span className="mt-2 block text-sm">
                  <span className="block font-pixel">{item.title}</span>
                  {item.type !== "artist" && item.artistName ? (
                    <span className="block">{item.artistName}</span>
                  ) : null}
                  <span className="block text-xs">
                    {item.type === "track"
                      ? "Song"
                      : item.type === "album"
                        ? "Album"
                        : "Artist"}
                  </span>
                </span>
              ) : null}
              <span className="sr-only">
                {item.title} by {getArtistLabel(item)} — {item.routeLabel}
              </span>
            </button>
          ))}
        </div>

        {!canvasUnavailable && seed?.coverUrl ? (
          <div
            key={seed.id}
            ref={selectedLabelRef}
            data-discovery-cover-label
            data-cover-url={seed.coverUrl}
            aria-hidden="true"
            className={styles.selectedCaption}
          >
            <span className={styles.captionType}>
              {seed.type === "track"
                ? "Song"
                : seed.type === "album"
                  ? "Album"
                  : "Artist"}
            </span>
            <span className="block text-balance break-words font-pixel text-sm font-medium leading-5 text-foreground">
              {seed.title}
            </span>
            {seed.type !== "artist" && seed.artistName ? (
              <span className="mt-1 block text-pretty text-xs leading-4 text-muted-foreground">
                {seed.artistName}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
