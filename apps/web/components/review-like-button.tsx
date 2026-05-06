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
  analyticsSource?: string | null;
};

export default function ReviewLikeButton({
  reviewId,
  initialCount,
  initialLiked,
  isAuthenticated,
  buttonRef,
  analyticsSource = null,
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
    source: analyticsSource,
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
    }, 200);
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
          "inline-flex min-h-8 items-center gap-1 rounded-md border border-transparent px-2 py-1 text-[11px] font-medium text-muted-foreground/88 transition-[color,background-color,transform] duration-150 hover:bg-foreground/[0.055] hover:text-foreground active:scale-[0.96] disabled:pointer-events-none",
          state.liked && "text-foreground",
          animatePulse && "bg-foreground/[0.075]",
          isPending && "opacity-80",
        )}
      >
        <Heart
          className={cn(
            "size-4 transition-colors duration-150",
            state.liked ? "fill-current text-foreground" : "text-muted-foreground",
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
