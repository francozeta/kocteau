"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { useReviewBookmark } from "@/hooks/use-review-bookmark";
import { toastActionError } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ReviewBookmarkButtonProps = {
  reviewId: string;
  initialBookmarked: boolean;
  isAuthenticated: boolean;
  refreshOnToggle?: boolean;
};

export default function ReviewBookmarkButton({
  reviewId,
  initialBookmarked,
  isAuthenticated,
  refreshOnToggle = false,
}: ReviewBookmarkButtonProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
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
      setAuthOpen(true);
      return;
    }

    triggerPulse();

    try {
      await toggleBookmark();

      if (refreshOnToggle) {
        router.refresh();
      }
    } catch (error) {
      toastActionError(error, "We couldn't update your saved reviews right now.");
    }
  }

  const authPrompt = (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div className="space-y-3">
        <h3 className="text-2xl font-semibold tracking-tight">Sign in to interact</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          You can browse reviews freely. To save one for later, you need an account first.
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
        aria-pressed={state.bookmarked}
        aria-busy={isPending}
        aria-label={state.bookmarked ? "Remove from saved reviews" : "Save this review"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-border/40 hover:bg-muted/40 hover:text-foreground active:scale-[0.98] disabled:pointer-events-none",
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

      {isMobile ? (
        <Drawer open={authOpen} onOpenChange={setAuthOpen}>
          <DrawerContent className="border-border/30">
            <DrawerHeader className="text-left">
              <DrawerTitle>Authentication required</DrawerTitle>
              <DrawerDescription>
                Log in or create an account to save reviews.
              </DrawerDescription>
            </DrawerHeader>
            {authPrompt}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={authOpen} onOpenChange={setAuthOpen}>
          <DialogContent className="max-w-md overflow-hidden border-border/30 p-0">
            <DialogHeader className="border-b border-border/30 px-6 py-4">
              <DialogTitle>Authentication required</DialogTitle>
              <DialogDescription>
                Log in or create an account to save reviews.
              </DialogDescription>
            </DialogHeader>
            {authPrompt}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
