"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReviewLike } from "@/hooks/use-review-like";
import { cn } from "@/lib/utils";

type ReviewLikeButtonProps = {
  reviewId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
};

export default function ReviewLikeButton({
  reviewId,
  initialCount,
  initialLiked,
  isAuthenticated,
}: ReviewLikeButtonProps) {
  const isMobile = useIsMobile();
  const [authOpen, setAuthOpen] = useState(false);
  const [animatePulse, setAnimatePulse] = useState(false);
  const pulseTimeoutRef = useRef<number | null>(null);
  const initialState = useMemo(
    () => ({
      count: initialCount,
      liked: initialLiked,
    }),
    [initialCount, initialLiked],
  );
  const { state, toggleLike, isPending } = useReviewLike({
    reviewId,
    initialState,
  });

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
      setAuthOpen(true);
      return;
    }

    triggerPulse();

    try {
      await toggleLike();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn't update your like right now.",
      );
    }
  }

  const authPrompt = (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div className="space-y-3">
        <h3 className="text-2xl font-semibold tracking-tight">Sign in to interact</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          You can browse reviews freely. To like a review and leave a stronger social signal,
          you need an account first.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/login" className="flex-1">
          <Button className="w-full">Log in</Button>
        </Link>
        <Link href="/signup" className="flex-1">
          <Button variant="outline" className="w-full">
            Create account
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={state.liked}
        aria-busy={isPending}
        aria-label={state.liked ? "Unlike this review" : "Like this review"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-border/40 hover:bg-muted/40 hover:text-foreground active:scale-[0.98] disabled:pointer-events-none",
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
        <span className={cn(animatePulse && "kocteau-like-count-pop")}>{state.count}</span>
      </button>

      {isMobile ? (
        <Drawer open={authOpen} onOpenChange={setAuthOpen}>
          <DrawerContent className="border-border/30">
            <DrawerHeader className="text-left">
              <DrawerTitle>Authentication required</DrawerTitle>
              <DrawerDescription>
                Log in or create an account to like reviews.
              </DrawerDescription>
            </DrawerHeader>
            {authPrompt}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={authOpen} onOpenChange={setAuthOpen}>
          <DialogContent className="max-w-md border-border/30 p-0 overflow-hidden">
            <DialogHeader className="border-b border-border/30 px-6 py-4">
              <DialogTitle>Authentication required</DialogTitle>
              <DialogDescription>
                Log in or create an account to like reviews.
              </DialogDescription>
            </DialogHeader>
            {authPrompt}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
