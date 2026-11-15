"use client";

import { useEffect, useRef, type ReactNode } from "react";

type GuestPreviewSequenceProps = {
  children: ReactNode;
};

/**
 * The mock product animates only when its contents are visible.
 * Unlike a mount-time CSS animation, this cannot finish below the fold.
 * The product is rendered normally on the server and when JS is disabled.
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

    const sequence: Animation[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        const targets = preview.querySelectorAll<HTMLElement>(
          "[data-guest-preview-step]",
        );
        // Different beats for shell navigation, primary content and context.
        const delays = [0, 130, 320, 470, 650];

        targets.forEach((target, index) => {
          sequence.push(
            target.animate(
              [
                {
                  opacity: 0,
                  filter: "blur(10px)",
                  transform: "translateY(20%)",
                },
                {
                  opacity: 1,
                  filter: "blur(0px)",
                  transform: "translateY(0%)",
                },
              ],
              {
                duration: 1050,
                delay: delays[index] ?? index * 125,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
              },
            ),
          );
        });
      },
      {
        threshold: 0.38,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(preview);
    return () => {
      observer.disconnect();
      sequence.forEach((animation) => animation.cancel());
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
