"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ImageSphere } from "@/lib/discovery/image-sphere";

export type DiscoveryOrbitItem = {
  id: string;
  title: string;
  artistName: string | null;
  coverUrl: string | null;
  href: string;
  routeLabel: string;
  reason: string;
  providerId: string;
  entityId: string | null;
};

type DiscoveryOrbitProps = {
  seed: {
    id: string;
    title: string;
    artistName: string | null;
    coverUrl: string | null;
    href: string;
  };
  items: DiscoveryOrbitItem[];
  keepSeedFocused?: boolean;
  onSelect: (item: DiscoveryOrbitItem) => void;
};

export default function DiscoveryOrbit({
  seed,
  items,
  keepSeedFocused = false,
  onSelect,
}: DiscoveryOrbitProps) {
  const isMobile = useIsMobile();
  const hostRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<ImageSphere | null>(null);
  const [focusedCoverUrl, setFocusedCoverUrl] = useState<string | null>(null);
  const sphereItems = useMemo(
    () =>
      [
        {
          ...seed,
          routeLabel: "Seed",
          reason: "The point you chose to begin from.",
        },
        ...items,
      ]
        .filter((item): item is typeof item & { coverUrl: string } =>
          Boolean(item.coverUrl),
        )
        .slice(0, isMobile ? 11 : 16),
    [isMobile, items, seed],
  );
  const imageUrls = useMemo(
    () => sphereItems.map((item) => item.coverUrl),
    [sphereItems],
  );
  const sphereItemsRef = useRef(sphereItems);
  const imageUrlsRef = useRef(imageUrls);
  const keepSeedFocusedRef = useRef(keepSeedFocused);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    sphereItemsRef.current = sphereItems;
    imageUrlsRef.current = imageUrls;
    keepSeedFocusedRef.current = keepSeedFocused;
    onSelectRef.current = onSelect;
  }, [imageUrls, keepSeedFocused, onSelect, sphereItems]);

  useEffect(() => {
    const host = hostRef.current;

    if (!host || imageUrlsRef.current.length === 0) {
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

    void import("@/lib/discovery/image-sphere").then(({ ImageSphere }) => {
      if (disposed) {
        return;
      }

      const compactViewport = host.clientWidth < 640;
      sphere = new ImageSphere(host, imageUrlsRef.current, {
        distance: compactViewport ? 590 : 560,
        fov: compactViewport ? 29 : 25,
        autoRotate: !reducedMotion.matches,
        initialFocusIndex: keepSeedFocusedRef.current ? 0 : undefined,
        hideFocusedPlane: true,
        onFocusChange: (index) => {
          setFocusedCoverUrl(
            index !== null
              ? sphereItemsRef.current[index]?.coverUrl ?? null
              : null,
          );
        },
        onSelect: (index) => {
          const item = sphereItemsRef.current[index];

          if (index > 0 && item && "providerId" in item) {
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
      initialFocusIndex: keepSeedFocused ? 0 : undefined,
    });
  }, [imageUrls, keepSeedFocused]);

  if (sphereItems.length === 0) {
    return null;
  }

  const focusedItem = focusedCoverUrl
    ? sphereItems.find((item) => item.coverUrl === focusedCoverUrl) ?? null
    : null;
  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div
        ref={hostRef}
        className="relative h-full min-h-[24rem] overflow-hidden bg-transparent sm:min-h-[30rem]"
        aria-label="A draggable 3D sphere of related music covers"
      >
        <div className="sr-only">
          {sphereItems.map((item) => (
            <PrefetchLink key={item.id} href={item.href}>
              {item.title} by {item.artistName || "Unknown artist"} — {item.routeLabel}
            </PrefetchLink>
          ))}
        </div>

        {focusedItem ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 z-10 bg-black/18 backdrop-blur-[10px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 z-20 grid place-items-center px-4 py-8"
              aria-live="polite"
            >
              <div className="flex max-h-full min-w-0 flex-col items-center">
                <EntityCoverImage
                  src={focusedItem.coverUrl}
                  alt=""
                  sizes="(max-width: 640px) 68vw, 42vh"
                  quality={88}
                  variant="card"
                  className="aspect-square w-[min(68vw,17rem)] shrink-0 rounded-[0.35rem] bg-muted/30 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] sm:w-[min(42vh,21rem)]"
                  iconClassName="size-8"
                />
                <div className="mt-4 max-w-[min(82vw,28rem)] text-center">
                  <p className="text-balance font-pixel text-[0.98rem] font-medium leading-tight text-foreground sm:text-[1.08rem]">
                    {focusedItem.title}
                  </p>
                  <p className="mt-1 truncate text-[12px] text-muted-foreground/72 sm:text-[13px]">
                    {focusedItem.artistName || "Unknown artist"}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
}
