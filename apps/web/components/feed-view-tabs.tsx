"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { FeedView } from "@/lib/feed-view";
import { cn } from "@/lib/utils";

const feedViews: Array<{
  value: FeedView;
  label: string;
}> = [
  {
    value: "for-you",
    label: "For You",
  },
  {
    value: "following",
    label: "Following",
  },
  {
    value: "top-rated",
    label: "Trending",
  },
];

function getFeedViewHref(view: FeedView) {
  if (view === "for-you") {
    return "/";
  }

  return `/?view=${view}`;
}

type FeedViewTabsProps = {
  activeView: FeedView;
  fullWidth?: boolean;
  className?: string;
};

export default function FeedViewTabs({
  activeView,
  fullWidth = false,
  className,
}: FeedViewTabsProps) {
  const activeIndex = feedViews.findIndex((view) => view.value === activeView);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "kocteau-feed-tabs mobile-liquid-panel relative grid min-w-0 grid-cols-3 gap-0.5 overflow-hidden rounded-[var(--kocteau-radius-control)] p-0.5",
        fullWidth ? "w-full" : "w-full max-w-[17.25rem] lg:w-[17.25rem]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1/3 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-border/42 transition-opacity max-md:hidden",
          (activeIndex === 0 || activeIndex === 1) && "opacity-0",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-2/3 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-border/42 transition-opacity max-md:hidden",
          (activeIndex === 1 || activeIndex === 2) && "opacity-0",
        )}
      />

      {feedViews.map((view) => {
        const isActive = activeView === view.value;

        return (
          <Link
            key={view.value}
            href={getFeedViewHref(view.value)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative z-10 inline-flex h-8 items-center justify-center rounded-[0.62rem] px-2.5 text-[13px] font-medium text-muted-foreground/84 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0",
              fullWidth ? "min-w-0 px-2" : "min-w-[5.1rem]",
              isActive ? "text-foreground" : "hover:text-foreground",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="feed-tab-active"
                className="kocteau-feed-tab-active absolute inset-0 rounded-[0.62rem]"
                transition={
                  prefersReducedMotion
                    ? {
                        duration: 0,
                      }
                    : {
                        duration: 0.18,
                        ease: "easeOut",
                      }
                }
              />
            ) : null}
            <span className={cn("relative z-10", fullWidth && "truncate")}>{view.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
