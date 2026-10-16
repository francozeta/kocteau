"use client";

import { type RefObject, useEffect } from "react";
import { usePortalTarget } from "@/hooks/use-portal-target";

const insetProperty = "--kocteau-search-viewport-inset";
const topProperty = "--kocteau-search-viewport-top";

export function useMobileSearchViewport(surfaceRef: RefObject<HTMLElement | null>) {
  const dockTarget = usePortalTarget("#mobile-search-dock");

  useEffect(() => {
    const viewport = window.visualViewport;
    const surface = surfaceRef.current;
    const dock = dockTarget?.parentElement;

    if (!viewport || !surface || !dock) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const viewportBottom = viewport.offsetTop + viewport.height;
      const surfaceRect = surface.getBoundingClientRect();
      const dockInset = viewport.scale === 1
        ? Math.max(0, window.innerHeight - viewportBottom)
        : 0;
      const surfaceInset = viewport.scale === 1
        ? Math.max(0, surfaceRect.bottom - viewportBottom)
        : 0;
      const surfaceTop = viewport.scale === 1
        ? Math.max(0, viewport.offsetTop - surfaceRect.top)
        : 0;

      dock.style.setProperty(insetProperty, `${dockInset}px`);
      surface.style.setProperty(insetProperty, `${surfaceInset}px`);
      surface.style.setProperty(topProperty, `${surfaceTop}px`);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(scheduleUpdate);

    observer.observe(surface);
    viewport.addEventListener("resize", scheduleUpdate);
    viewport.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    update();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      viewport.removeEventListener("resize", scheduleUpdate);
      viewport.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      dock.style.removeProperty(insetProperty);
      surface.style.removeProperty(insetProperty);
      surface.style.removeProperty(topProperty);
    };
  }, [dockTarget, surfaceRef]);
}
