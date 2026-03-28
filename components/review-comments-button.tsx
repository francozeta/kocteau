"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
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
import ReviewCommentsPanel from "@/components/review-comments-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReviewComments } from "@/hooks/use-review-comments";
import { cn } from "@/lib/utils";

type ReviewCommentsButtonProps = {
  reviewId: string;
  initialCount: number;
  isAuthenticated: boolean;
};

export default function ReviewCommentsButton({
  reviewId,
  initialCount,
  isAuthenticated,
}: ReviewCommentsButtonProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { commentsCount } = useReviewComments({
    reviewId,
    initialCount,
    enabled: open,
  });

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open comments"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-border/40 hover:bg-muted/40 hover:text-foreground active:scale-[0.98]",
        open && "text-foreground",
      )}
    >
      <MessageCircle className="size-4" />
      <span>{commentsCount}</span>
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
            variant="dialog"
          />
        </DrawerContent>
      </Drawer>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[min(82vh,42rem)] max-w-2xl flex-col overflow-hidden border-border/30 p-0">
          <DialogHeader className="border-b border-border/30 px-6 py-4">
            <DialogTitle>Comments</DialogTitle>
          <DialogDescription>
            {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
          </DialogDescription>
        </DialogHeader>
        <ReviewCommentsPanel
          reviewId={reviewId}
          initialCount={initialCount}
          isAuthenticated={isAuthenticated}
          variant="dialog"
        />
      </DialogContent>
    </Dialog>
    </>
  );
}
