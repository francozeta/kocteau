"use client";

import { useState } from "react";
import { MessageCircle } from "@/components/ui/icons";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ReviewCommentsPanel from "@/components/review-comments-panel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReviewComments } from "@/hooks/use-review-comments";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type ReviewCommentsButtonProps = {
  reviewId: string;
  initialCount: number;
  isAuthenticated: boolean;
  analyticsSource?: string | null;
  viewer?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  inlineTarget?: {
    targetId: string;
    composerId?: string;
  } | null;
};

export default function ReviewCommentsButton({
  reviewId,
  initialCount,
  isAuthenticated,
  analyticsSource = null,
  viewer = null,
  inlineTarget = null,
}: ReviewCommentsButtonProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { commentsCount } = useReviewComments({
    reviewId,
    initialCount,
    enabled: open,
  });
  const commentsDescription =
    commentsCount > 0
      ? `${commentsCount} ${commentsCount === 1 ? "reply" : "replies"}`
      : "No replies yet";

  function handleTriggerClick() {
    if (inlineTarget) {
      const target = document.getElementById(inlineTarget.targetId);

      target?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      const composerId = inlineTarget.composerId;

      if (isAuthenticated && composerId && !isMobile) {
        window.requestAnimationFrame(() => {
          document.getElementById(composerId)?.focus();
        });
      }

      return;
    }

    if (!isAuthenticated) {
      toastAuthRequired("comment");
      return;
    }

    setOpen((current) => {
      const nextOpen = !current;

      if (nextOpen && analyticsSource === "feed:for-you") {
        trackAnalyticsEvent({
          eventType: "for_you_review_action",
          source: analyticsSource,
          metadata: {
            action: "open_comments",
            review_id: reviewId,
          },
        });
      }

      return nextOpen;
    });
  }

  const trigger = (
    <button
      type="button"
      onClick={handleTriggerClick}
      aria-label={inlineTarget ? "Reply to this review" : open ? "Close comments" : "Open comments"}
      aria-expanded={inlineTarget ? undefined : open}
      className={cn(
        "inline-flex min-h-8 items-center gap-1 rounded-md border border-transparent px-2 py-1 text-[11px] font-medium text-muted-foreground/88 transition-[color,background-color,transform] duration-150 hover:bg-foreground/[0.055] hover:text-foreground active:scale-[0.96]",
        open && "text-foreground",
      )}
    >
      <MessageCircle className="size-4" />
      {commentsCount > 0 ? <span>{commentsCount}</span> : null}
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="flex h-[88vh] max-h-[88vh] flex-col p-0 text-foreground before:inset-0 before:rounded-t-[1.35rem] before:border-x before:border-b-0 before:border-t before:border-border/36 before:bg-background">
            <DrawerHeader className="border-b border-border/24 px-4 py-3 text-left">
              <DrawerTitle>Comments</DrawerTitle>
              <DrawerDescription className="sr-only">{commentsDescription}</DrawerDescription>
            </DrawerHeader>
            <ReviewCommentsPanel
              reviewId={reviewId}
              initialCount={initialCount}
              isAuthenticated={isAuthenticated}
              viewer={viewer}
              variant="dialog"
              autoFocusComposer={open && !isMobile}
            />
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        <SheetContent
          side="right"
          showOverlay={false}
          className="border-border/30 bg-background/98 p-0 shadow-none ring-0 supports-backdrop-filter:backdrop-blur-xl data-[side=right]:w-[min(24rem,calc(100vw-0.75rem))] data-[side=right]:rounded-none data-[side=right]:sm:max-w-[24rem]"
        >
          <SheetHeader className="border-b border-border/24 px-4 py-3 pr-12">
            <SheetTitle>Comments</SheetTitle>
            <SheetDescription className="sr-only">{commentsDescription}</SheetDescription>
          </SheetHeader>
          <ReviewCommentsPanel
            reviewId={reviewId}
            initialCount={initialCount}
            isAuthenticated={isAuthenticated}
            viewer={viewer}
            variant="dialog"
            autoFocusComposer={open}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
