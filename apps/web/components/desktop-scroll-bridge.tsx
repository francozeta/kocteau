"use client";

import { useEffect } from "react";

const desktopQuery = "(min-width: 1024px)";

function canScrollElement(element: HTMLElement, deltaY: number) {
  const style = window.getComputedStyle(element);
  const canOverflow =
    style.overflowY === "auto" ||
    style.overflowY === "scroll" ||
    style.overflowY === "overlay";

  if (!canOverflow || element.scrollHeight <= element.clientHeight + 1) {
    return false;
  }

  if (deltaY < 0) {
    return element.scrollTop > 0;
  }

  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  }

  return false;
}

function targetCanHandleScroll({
  boundary,
  deltaY,
  main,
  target,
}: {
  boundary: HTMLElement;
  deltaY: number;
  main: HTMLElement;
  target: EventTarget | null;
}) {
  if (!(target instanceof Node)) {
    return false;
  }

  if (main.contains(target)) {
    return true;
  }

  let current: Node | null = target;

  while (current && current !== boundary) {
    if (current instanceof HTMLElement && canScrollElement(current, deltaY)) {
      return true;
    }

    current = current.parentNode;
  }

  return false;
}

export default function DesktopScrollBridge() {
  useEffect(() => {
    const boundaryElement = document.querySelector<HTMLElement>("[data-kocteau-scroll-boundary]");
    const mainElement = document.querySelector<HTMLElement>("[data-kocteau-scroll-main]");

    if (!boundaryElement || !mainElement) {
      return undefined;
    }

    const boundary = boundaryElement;
    const main = mainElement;
    const media = window.matchMedia(desktopQuery);

    function handleWheel(event: WheelEvent) {
      if (
        !media.matches ||
        event.defaultPrevented ||
        event.ctrlKey ||
        Math.abs(event.deltaY) <= Math.abs(event.deltaX)
      ) {
        return;
      }

      if (
        targetCanHandleScroll({
          boundary,
          deltaY: event.deltaY,
          main,
          target: event.target,
        })
      ) {
        return;
      }

      const maxScrollTop = main.scrollHeight - main.clientHeight;

      if (maxScrollTop <= 0) {
        return;
      }

      const nextScrollTop = Math.min(
        maxScrollTop,
        Math.max(0, main.scrollTop + event.deltaY),
      );

      if (nextScrollTop === main.scrollTop) {
        return;
      }

      event.preventDefault();
      main.scrollTop = nextScrollTop;
    }

    boundary.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      boundary.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
}
