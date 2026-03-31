"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Ref } from "react";
import { Bookmark } from "lucide-react";
import { useReviewBookmark } from "@/hooks/use-review-bookmark";
import { toastActionError, toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ReviewBookmarkButtonProps = {
  reviewId: string;
  initialBookmarked: boolean;
  isAuthenticated: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
};

export default function ReviewBookmarkButton({
  reviewId,
  initialBookmarked,
  isAuthenticated,
  buttonRef,
}: ReviewBookmarkButtonProps) {
  const [animatePulse, setAnimatePulse] = useState(false);
  const pulseTimeoutRef = useRef<number | null>(null);
  const initialState = useMemo(
    () => ({
      bookmarked: initialBookmarked,
    }),
    [initialBookmarked],
  );
  const { state, toggleBookmark, isPending } = useReviewBookmark({
    reviewId,
    initialState,
  });

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  function triggerPulse() {
    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current);
    }

    setAnimatePulse(true);
    pulseTimeoutRef.current = window.setTimeout(() => {
      setAnimatePulse(false);
      pulseTimeoutRef.current = null;
    }, 280);
  }

  async function handleClick() {
    if (!isAuthenticated) {
      toastAuthRequired("bookmark");
      return;
    }

    triggerPulse();

    try {
      await toggleBookmark();
    } catch (error) {
      toastActionError(error, "We couldn't update your saved reviews right now.");
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={state.bookmarked}
      aria-busy={isPending}
      aria-label={state.bookmarked ? "Remove from saved reviews" : "Save this review"}
      className={cn(
        "inline-flex min-h-8 items-center gap-1 rounded-full border border-transparent px-2 py-1 text-[11px] font-medium text-muted-foreground/88 transition-all duration-200 hover:bg-muted/34 hover:text-foreground active:scale-[0.98] disabled:pointer-events-none",
        state.bookmarked && "text-foreground",
        animatePulse && "bg-muted/60",
        isPending && "opacity-80",
      )}
    >
      <Bookmark
        className={cn(
          "size-4 transition-all duration-200",
          state.bookmarked ? "fill-current text-foreground" : "text-muted-foreground",
          animatePulse && "kocteau-save-pop",
          isPending && "scale-110",
        )}
      />
    </button>
  );
}
