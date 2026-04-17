"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Ref } from "react";
import { Heart } from "lucide-react";
import { useReviewLike } from "@/hooks/use-review-like";
import { toastActionError, toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ReviewLikeButtonProps = {
  reviewId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
};

export default function ReviewLikeButton({
  reviewId,
  initialCount,
  initialLiked,
  isAuthenticated,
  buttonRef,
}: ReviewLikeButtonProps) {
  const [animatePulse, setAnimatePulse] = useState(false);
  const pulseTimeoutRef = useRef<number | null>(null);
  const initialState = useMemo(
    () => ({
      count: Math.max(initialCount, initialLiked ? 1 : 0),
      liked: initialLiked,
    }),
    [initialCount, initialLiked],
  );
  const { state, toggleLike, isPending } = useReviewLike({
    reviewId,
    initialState,
  });
  const visibleCount = Math.max(state.count, state.liked ? 1 : 0);

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
    }, 320);
  }

  async function handleClick() {
    if (!isAuthenticated) {
      toastAuthRequired("like");
      return;
    }

    triggerPulse();

    try {
      await toggleLike();
    } catch (error) {
      toastActionError(error, "We couldn't update your like right now.");
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={state.liked}
        aria-busy={isPending}
        aria-label={state.liked ? "Unlike this review" : "Like this review"}
        className={cn(
          "inline-flex min-h-8 items-center gap-1 rounded-full border border-transparent px-2 py-1 text-[11px] font-medium text-muted-foreground/88 transition-all duration-200 hover:bg-muted/34 hover:text-foreground active:scale-[0.98] disabled:pointer-events-none",
          state.liked && "text-foreground",
          animatePulse && "bg-rose-500/8",
          isPending && "opacity-80",
        )}
      >
        <Heart
          className={cn(
            "size-4 transition-all duration-200",
            state.liked ? "fill-rose-500 text-rose-500" : "text-muted-foreground",
            animatePulse && "kocteau-like-pop",
            isPending && "scale-110",
          )}
        />
        {visibleCount > 0 ? (
          <span className={cn(animatePulse && "kocteau-like-count-pop")}>{visibleCount}</span>
        ) : null}
      </button>
    </>
  );
}
