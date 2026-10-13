"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@/components/ui/icons";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type TrackCarouselProps = {
  ariaLabel: string;
  children: ReactNode[];
  itemClassName: string;
  controlClassName?: string;
  contentClassName?: string;
  viewportClassName?: string;
  fadeClassName?: string;
  compactControls?: boolean;
};

function TrackCarouselContent({
  children,
  contentClassName,
  fadeClassName,
  itemClassName,
  viewportClassName,
}: Pick<
  TrackCarouselProps,
  "children" | "contentClassName" | "fadeClassName" | "itemClassName" | "viewportClassName"
>) {
  const { canScrollNext } = useCarousel();

  return (
    <CarouselContent
      viewportClassName={cn(
        "overflow-hidden py-0.5",
        canScrollNext && "kocteau-carousel-mask-r",
        canScrollNext && fadeClassName,
        viewportClassName,
      )}
      className={cn("ml-0 gap-4", contentClassName)}
    >
      {children.map((child, index) => (
        <CarouselItem
          key={index}
          className={cn("pl-0", itemClassName)}
        >
          {child}
        </CarouselItem>
      ))}
    </CarouselContent>
  );
}

function TrackCarouselControls({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { canScrollNext, canScrollPrev, scrollNext, scrollPrev } = useCarousel();

  if (!canScrollNext && !canScrollPrev) {
    return null;
  }

  const buttonClassName = cn(
    "pointer-events-auto inline-flex items-center justify-center rounded-full border border-white/[0.08] bg-popover/94 text-muted-foreground shadow-none backdrop-blur transition-[opacity,background-color,color,transform] duration-150 ease-[var(--kocteau-ease)] hover:bg-muted/78 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-0 active:scale-[0.96]",
    compact ? "size-7" : "size-8",
  );
  const iconClassName = compact ? "size-3.5" : "size-4";

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 hidden -translate-y-1/2 items-center justify-between opacity-0 transition-opacity duration-150 ease-[var(--kocteau-ease)] group-hover/track-carousel:opacity-100 group-focus-within/track-carousel:opacity-100 md:flex",
        "top-[calc((var(--kocteau-carousel-cover-size,8.5rem)/2)+0.125rem)]",
        compact ? "-left-2.5 -right-2.5" : "-left-3 -right-3",
        className,
      )}
    >
      <button
        type="button"
        className={buttonClassName}
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Previous tracks"
      >
        <CaretLeftIcon className={iconClassName} weight="bold" />
      </button>
      <button
        type="button"
        className={buttonClassName}
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Next tracks"
      >
        <CaretRightIcon className={iconClassName} weight="bold" />
      </button>
    </div>
  );
}

function TrackCarouselWheelNavigation() {
  const {
    api,
    canScrollNext,
    canScrollPrev,
    scrollNext,
    scrollPrev,
  } = useCarousel();
  const canScrollNextRef = useRef(canScrollNext);
  const canScrollPrevRef = useRef(canScrollPrev);
  const wheelDeltaRef = useRef(0);
  const lastScrollAtRef = useRef(0);

  useEffect(() => {
    canScrollNextRef.current = canScrollNext;
    canScrollPrevRef.current = canScrollPrev;
  }, [canScrollNext, canScrollPrev]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const rootNode = api.rootNode();

    function handleWheel(event: WheelEvent) {
      const hasHorizontalIntent =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;

      if (!hasHorizontalIntent) {
        return;
      }

      const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
      const normalizedDelta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE ? rawDelta * 16 : rawDelta;
      const direction = Math.sign(normalizedDelta);

      if (direction === 0) {
        return;
      }

      const canScroll = direction > 0
        ? canScrollNextRef.current
        : canScrollPrevRef.current;

      if (!canScroll) {
        wheelDeltaRef.current = 0;
        return;
      }

      event.preventDefault();
      wheelDeltaRef.current += normalizedDelta;

      if (Math.sign(wheelDeltaRef.current) !== direction) {
        wheelDeltaRef.current = normalizedDelta;
      }

      const now = performance.now();

      if (
        Math.abs(wheelDeltaRef.current) < 42 ||
        now - lastScrollAtRef.current < 360
      ) {
        return;
      }

      if (direction > 0) {
        scrollNext();
      } else {
        scrollPrev();
      }

      wheelDeltaRef.current = 0;
      lastScrollAtRef.current = now;
    }

    rootNode.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      rootNode.removeEventListener("wheel", handleWheel);
    };
  }, [api, scrollNext, scrollPrev]);

  return null;
}

export default function TrackCarousel({
  ariaLabel,
  children,
  compactControls = false,
  controlClassName,
  contentClassName,
  fadeClassName,
  itemClassName,
  viewportClassName,
}: TrackCarouselProps) {
  return (
    <Carousel
      aria-label={ariaLabel}
      className="group/track-carousel -mx-1 px-1"
      opts={{
        align: "start",
        containScroll: "trimSnaps",
        dragFree: false,
        slidesToScroll: "auto",
      }}
    >
      <TrackCarouselContent
        contentClassName={contentClassName}
        fadeClassName={fadeClassName}
        itemClassName={itemClassName}
        viewportClassName={viewportClassName}
      >
        {children}
      </TrackCarouselContent>
      <TrackCarouselWheelNavigation />
      <TrackCarouselControls compact={compactControls} className={controlClassName} />
    </Carousel>
  );
}
