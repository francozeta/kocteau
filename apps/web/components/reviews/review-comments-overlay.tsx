"use client";

import ReviewCommentsPanel from "@/components/reviews/review-comments-panel";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ReviewCommentsOverlayProps = {
  reviewId: string;
  initialCount: number;
  isAuthenticated: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  commentsDescription: string;
  viewer: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

// Only load the heavy comment panel, responsive dialogs and composer after
// someone requests comments. Keep the root mounted after first open so the
// Radix/Vaul exit transitions still work.
export default function ReviewCommentsOverlay({
  reviewId,
  initialCount,
  isAuthenticated,
  open,
  onOpenChange,
  isMobile,
  commentsDescription,
  viewer,
}: ReviewCommentsOverlayProps) {
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
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
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
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
  );
}
