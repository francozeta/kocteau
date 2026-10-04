"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import type { FeedView } from "@/lib/feed-view";
import { getFeedViewHref } from "@/lib/feed-view";
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

type FeedViewTabsProps = {
  activeView: FeedView;
  fullWidth?: boolean;
  className?: string;
  onViewChange?: (view: FeedView) => void;
};

export default function FeedViewTabs({
  activeView,
  fullWidth = false,
  className,
  onViewChange,
}: FeedViewTabsProps) {
  function handleViewClick(
    event: MouseEvent<HTMLAnchorElement>,
    view: FeedView,
  ) {
    if (
      !onViewChange ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    onViewChange(view);
  }

  return (
    <div
      className={cn(
        "kocteau-feed-tabs relative grid min-w-0 grid-cols-3 gap-1 overflow-visible rounded-full p-0.5",
        fullWidth ? "w-full" : "w-full max-w-[17.25rem] lg:w-[17.25rem]",
        className,
      )}
    >
      {feedViews.map((view) => {
        const isActive = activeView === view.value;

        return (
          <Link
            key={view.value}
            href={getFeedViewHref(view.value)}
            prefetch={false}
            onClick={(event) => handleViewClick(event, view.value)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative z-10 inline-flex h-8 items-center justify-center rounded-full px-2.5 text-[13px] font-medium text-muted-foreground/78 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0",
              fullWidth ? "min-w-0 px-2" : "min-w-[5.1rem]",
              isActive ? "kocteau-feed-tab-active text-foreground" : "hover:text-foreground",
            )}
          >
            <span className={cn("relative z-10", fullWidth && "truncate")}>{view.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
