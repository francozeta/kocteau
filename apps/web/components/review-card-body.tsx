"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ReviewCardBodyProps = {
  body: string;
  className?: string;
  clampLines?: 3 | 4 | 5;
};

export default function ReviewCardBody({
  body,
  className,
  clampLines,
}: ReviewCardBodyProps) {
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const isCollapsed = Boolean(clampLines && !expanded);
  const likelyNeedsToggle = Boolean(
    clampLines &&
      body.trim().length >
        (clampLines === 5 ? 420 : clampLines === 4 ? 280 : 220),
  );
  const canToggle = hasOverflow || likelyNeedsToggle;

  useEffect(() => {
    if (!clampLines || expanded) {
      return;
    }

    const node = bodyRef.current;

    if (!node) {
      return;
    }

    const syncOverflow = () => {
      setHasOverflow(node.scrollHeight > node.clientHeight + 1);
    };

    syncOverflow();

    const observer = new ResizeObserver(syncOverflow);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [body, clampLines, expanded]);

  return (
    <div className="space-y-1.5">
      <p
        ref={bodyRef}
        className={cn(
          className,
          isCollapsed && clampLines === 3 && "line-clamp-3",
          isCollapsed && clampLines === 4 && "line-clamp-4",
          isCollapsed && clampLines === 5 && "line-clamp-5",
        )}
      >
        {body}
      </p>

      {canToggle ? (
        <button
          aria-expanded={expanded}
          className="relative z-[2] inline-flex h-8 items-center rounded-[0.48rem] pr-2 text-[12.5px] font-medium text-muted-foreground/82 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          data-prevent-review-link="true"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
          type="button"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
