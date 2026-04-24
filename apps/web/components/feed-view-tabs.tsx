import Link from "next/link";
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
    label: "Top",
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

  return (
    <div
      className={cn(
        "relative grid min-w-0 grid-cols-3 gap-0.5 overflow-hidden rounded-[0.95rem] border border-white/[0.08] bg-[#111112] p-1",
        fullWidth ? "w-full" : "w-full max-w-[16.75rem] lg:w-[16.75rem]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1/3 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.08] transition-opacity",
          (activeIndex === 0 || activeIndex === 1) && "opacity-0",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-2/3 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.08] transition-opacity",
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
              "relative z-10 inline-flex h-8 items-center justify-center rounded-[0.7rem] px-3 text-sm font-medium text-muted-foreground/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-0",
              fullWidth ? "min-w-0 px-2" : "min-w-[4.65rem]",
              isActive
                ? "bg-white/[0.08] text-foreground"
                : "hover:text-foreground",
            )}
          >
            <span className={cn(fullWidth && "truncate")}>{view.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
