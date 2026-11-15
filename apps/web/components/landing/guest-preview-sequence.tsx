"use client";

import { useEffect, useRef, type ReactNode } from "react";

type GuestPreviewSequenceProps = {
  children: ReactNode;
};

const ease = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * Animate the *product story*, not the whole product as a single block.
 * Interfere's documented timeline grammar is line → marker → content.
 * Keeping the markup visible by default preserves SSR, no-JS and reduced motion.
 */
export default function GuestPreviewSequence({
  children,
}: GuestPreviewSequenceProps) {
  const previewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const preview = previewRef.current;
    if (
      !preview ||
      typeof IntersectionObserver === "undefined" ||
      typeof preview.animate !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const running: Animation[] = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const play = (
      target: Element | null | undefined,
      frames: Keyframe[],
      duration: number,
      delay: number,
    ) => {
      if (!(target instanceof HTMLElement)) return;
      running.push(
        target.animate(frames, {
          duration,
          delay,
          easing: ease,
          fill: "both",
        }),
      );
    };

    const appear = (
      target: Element | null | undefined,
      delay: number,
      options: { duration?: number; blur?: number; offset?: number } = {},
    ) => {
      const { duration = 650, blur = 6, offset = 10 } = options;
      play(
        target,
        [
          {
            opacity: 0,
            filter: `blur(${blur}px)`,
            transform: `translateY(${offset}px)`,
          },
          { opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" },
        ],
        duration,
        delay,
      );
    };

    const revealProduct = () => {
      const compact = window.matchMedia("(max-width: 1023px)").matches;
      // Establish the app shell, then let its content arrive.
      const phases = [
        ["sidebar", 0],
        ["header", 130],
        ["tabs", 330],
        ["review", compact ? 1880 : 500],
        ["editorial", 700],
      ] as const;
      for (const [phase, delay] of phases) {
        appear(
          preview.querySelector(`[data-guest-preview-step="${phase}"]`),
          delay,
          { duration: 780, blur: phase === "review" ? 4 : 2, offset: 9 },
        );
      }

      // Small independent pieces: the real Kocteau mock UI, not an image.
      preview
        .querySelectorAll("[data-guest-preview-nav-item]")
        .forEach((item, index) =>
          appear(item, 140 + index * 65, { duration: 620, blur: 3, offset: 7 }),
        );

      const cardContent = preview.querySelector(
        '[data-guest-preview-step="review"] .kocteau-review-card > div',
      );
      Array.from(cardContent?.children ?? []).forEach((piece, index) => {
        // Author → cover/title → writing → actions.
        const delays = compact
          ? [1980, 2200, 2480, 2790]
          : [620, 850, 1140, 1490];
        appear(piece, delays[index] ?? delays[3] + index * 140, {
          duration: 750,
          blur: index === 1 ? 7 : 5,
          offset: 12,
        });
      });

      // Like Interfere: draw the line, pop the marker, reveal the event copy.
      const events = preview.querySelectorAll(
        "[data-guest-preview-timeline-event]",
      );
      events.forEach((event, index) => {
        // The visible timeline is above the review on mobile, in the rail on desktop.
        if (event.getClientRects().length === 0) return;
        const start = compact ? 540 + index * 470 : 1130 + index * 620;
        const line = event.querySelector("[data-guest-preview-line]");
        const marker = event.querySelector("[data-guest-preview-marker]");
        const copy = event.querySelector("[data-guest-preview-timeline-content]");

        if (line) {
          play(
            line,
            [
              { transform: "scaleY(0)", opacity: 0.15 },
              { transform: "scaleY(1)", opacity: 1 },
            ],
            300,
            start,
          );
        }
        play(
          marker,
          [
            { transform: "scale(0.25)", opacity: 0 },
            { transform: "scale(1)", opacity: 1 },
          ],
          260,
          start + (line ? 310 : 0),
        );
        appear(copy, start + (line ? 405 : 130), {
          duration: 520,
          blur: 5,
          offset: 8,
        });
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        if (!reducedMotion.matches) revealProduct();
      },
      { threshold: 0.38, rootMargin: "0px 0px -25% 0px" },
    );

    const onMotionPreferenceChange = () => {
      if (reducedMotion.matches) {
        observer.disconnect();
        running.forEach((animation) => animation.cancel());
        running.length = 0;
      }
    };

    reducedMotion.addEventListener("change", onMotionPreferenceChange);
    observer.observe(preview);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
      running.forEach((animation) => animation.cancel());
    };
  }, []);

  return (
    <section
      ref={previewRef}
      aria-label="Kocteau authenticated feed preview"
      className="kocteau-product-preview w-[calc(100%+5.5rem)] max-w-none sm:w-[calc(100%+4rem)] lg:w-[calc(100%+2rem)] xl:w-[calc(100%+3rem)]"
    >
      {children}
    </section>
  );
}
