"use client";

import { useRef } from "react";
import { seedKey, type CanvasFrame } from "@/lib/discovery/canvas";

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
  let message = "";

  if (frame.focus) {
    if (finding) {
      message = hasRelatedMusic ? "Looking for more music…" : "Finding related music…";
    } else if (hasError) {
      message = hasRelatedMusic
        ? "Some music couldn’t load."
        : "Couldn’t load new music.";
    } else {
      message = hasRelatedMusic
        ? "Choose another cover to keep exploring."
        : "No new music found. Try another cover or search.";
    }
  }

  return (
    <div
      data-discovery-feedback
      className="pointer-events-none absolute inset-x-6 bottom-[calc(env(safe-area-inset-bottom)+9rem)] z-20 flex flex-col items-center gap-1 lg:bottom-20"
    >
      <p
        ref={statusRef}
        role="status"
        aria-atomic="true"
        tabIndex={-1}
        className={message
          ? "max-w-sm rounded-lg bg-[var(--kocteau-shell)] px-3 py-2 text-center text-xs leading-5 text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
          : "sr-only"}
      >
        {message}
      </p>
      {frame.focus && hasError && !finding ? (
        <button
          type="button"
          onClick={() => {
            onRetry();
            statusRef.current?.focus({ preventScroll: true });
          }}
          className="pointer-events-auto min-h-11 rounded-full bg-[var(--kocteau-surface-control)] px-4 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-[var(--kocteau-surface-control-hover)]"
        >
          Retry discovery
        </button>
      ) : null}
    </div>
  );
}
