"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
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
};

export default function ReviewCommentsButton({
  reviewId,
  initialCount,
  isAuthenticated,
  analyticsSource = null,
  viewer = null,
}: ReviewCommentsButtonProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { commentsCount } = useReviewComments({
    reviewId,
    initialCount,
    enabled: open,
  });

  function handleTriggerClick() {
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
      aria-label={open ? "Close comments" : "Open comments"}
      aria-expanded={open}
      className={cn(
        "inline-flex min-h-8 items-center gap-1 rounded-full border border-transparent px-2 py-1 text-[11px] font-medium text-muted-foreground/88 transition-all duration-200 hover:bg-muted/34 hover:text-foreground active:scale-[0.98]",
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
          <DrawerContent className="flex h-[88vh] max-h-[88vh] flex-col border-border/30">
            <DrawerHeader className="border-b border-border/30 text-left">
              <DrawerTitle>Comments</DrawerTitle>
              <DrawerDescription>
                {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
              </DrawerDescription>
            </DrawerHeader>
            <ReviewCommentsPanel
              reviewId={reviewId}
              initialCount={initialCount}
              isAuthenticated={isAuthenticated}
              viewer={viewer}
              variant="dialog"
              autoFocusComposer={open}
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
          className="border-border/30 bg-background/95 p-0 supports-backdrop-filter:backdrop-blur-xl data-[side=right]:w-[min(21.5rem,calc(100vw-0.75rem))] data-[side=right]:rounded-l-[1.5rem] data-[side=right]:sm:max-w-[21.5rem]"
        >
          <SheetHeader className="border-b border-border/30 px-4 py-4 pr-12">
            <SheetTitle>Comments</SheetTitle>
            <SheetDescription>
              {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
            </SheetDescription>
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
