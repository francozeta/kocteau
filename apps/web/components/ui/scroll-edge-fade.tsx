"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/**
 * A compact adaptation of Craft's published Scroll Fades technique.
 * The mask tracks the content actually available beyond each edge; it never
 * overlays clicks or fades a non-scrollable row.
 *
 * https://craft.gustavofior.com/scroll-fades
 */
export function ScrollEdgeFade({
  axis = "x",
  fadeSize = 20,
  children,
  ...props
}: ComponentProps<"div"> & {
  axis?: "x" | "y";
  fadeSize?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const max =
        axis === "x"
          ? node.scrollWidth - node.clientWidth
          : node.scrollHeight - node.clientHeight;
      if (max <= 1) {
        node.style.maskImage = "none";
        return;
      }

      const position = axis === "x" ? node.scrollLeft : node.scrollTop;
      const start = Math.min(fadeSize, Math.max(0, position));
      const end = Math.min(fadeSize, Math.max(0, max - position));
      const direction = axis === "x" ? "right" : "bottom";
      node.style.maskImage =
        `linear-gradient(to ${direction}, transparent, black ${start}px, black calc(100% - ${end}px), transparent)`;
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    const resize = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(schedule)
      : null;
    resize?.observe(node);
    for (const child of node.children) resize?.observe(child);

    node.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      node.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resize?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      node.style.maskImage = "";
    };
  }, [axis, fadeSize]);

  return (
    <div ref={ref} data-scroll-edge-fade={axis} {...props}>
      {children}
    </div>
  );
}
