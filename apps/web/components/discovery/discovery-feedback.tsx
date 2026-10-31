"use client";

import { useRef } from "react";
import { seedKey, type CanvasFrame } from "@/lib/discovery/canvas";
import { cn } from "@/lib/utils";

export default function DiscoveryFeedback({
  frame,
  pending,
  hasError,
  onRetry,
}: {
  frame: CanvasFrame;
  pending: boolean;
  hasError: boolean;
  onRetry: () => void;
}) {
  const statusRef = useRef<HTMLParagraphElement>(null);
  const focusKey = frame.focus ? seedKey(frame.focus) : null;
  const hasRelatedMusic = frame.nodes.some(
    (node) => node.from === focusKey && focusKey !== null,
  );
  const finding = pending || (!frame.resolved && !hasError);
  const ready =
    frame.focus?.cover_url && !finding && !hasError && hasRelatedMusic;
  let message = "";

  if (frame.focus) {
    if (finding) {
      message = hasRelatedMusic
        ? "Looking for more music…"
        : "Finding related music…";
    } else if (hasError) {
      message = hasRelatedMusic
        ? "Some music couldn’t load."
        : "Couldn’t load new music.";
    } else {
      message = hasRelatedMusic
        ? "Choose another cover to keep exploring."
        : "No new music found. Try another cover.";
    }
  }

  return (
    <div
      data-discovery-feedback
      className={cn(
        "pointer-events-none absolute inset-x-6 top-[calc(env(safe-area-inset-top)+5rem)] z-20 flex items-center justify-center gap-2 lg:top-5",
        hasError && !finding ? "flex-row" : "flex-col",
      )}
    >
      <p
        ref={statusRef}
        role="status"
        aria-atomic="true"
        tabIndex={-1}
        className={cn(
          "max-w-sm rounded-lg bg-[var(--kocteau-shell)] px-3 py-2 text-center text-xs leading-5 text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring",
          !message
            ? "sr-only"
            : ready
              ? "sr-only focus:not-sr-only"
              : undefined,
        )}
      >
        {message}
      </p>
      {frame.focus && hasError && !finding ? (
        <button
          type="button"
          aria-label="Retry discovery"
          onClick={() => {
            onRetry();
            statusRef.current?.focus({ preventScroll: true });
          }}
          className="pointer-events-auto min-h-11 shrink-0 rounded-full bg-[var(--kocteau-surface-control)] px-4 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-[var(--kocteau-surface-control-hover)]"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
