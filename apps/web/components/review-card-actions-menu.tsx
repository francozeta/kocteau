"use client";

import { useState, type ReactNode } from "react";
import EditReviewDialog, { type EditReviewDialogSeed } from "@/components/edit-review-dialog";
import {
  KocteauBookmarkIcon,
  KocteauCopyIcon,
  KocteauEditIcon,
  KocteauFlagIcon,
  KocteauMoreIcon,
  KocteauSongIcon,
  KocteauTrashIcon,
} from "@/components/kocteau-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReviewBookmark } from "@/hooks/use-review-bookmark";
import { toastActionError, toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import {
  ReviewDeleteDialog,
  type ReviewActionTarget,
  useReviewActions,
} from "@/components/review-actions";

type ReviewCardActionsMenuProps = ReviewActionTarget & {
  canManage?: boolean;
  trigger?: ReactNode;
  editSeed?: EditReviewDialogSeed | null;
  initialBookmarked?: boolean;
  isAuthenticated?: boolean;
};

const actionClassName =
  "flex min-h-11 w-full items-center gap-3 rounded-[0.72rem] px-3 text-left text-sm font-medium text-foreground/88 transition-[color,background-color,transform] duration-150 hover:bg-foreground/[0.055] hover:text-foreground active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65 disabled:pointer-events-none disabled:opacity-45 md:min-h-10";

export default function ReviewCardActionsMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  reviewPath = null,
  entityPath = null,
  canManage = false,
  trigger,
  editSeed = null,
  initialBookmarked = false,
  isAuthenticated = false,
}: ReviewCardActionsMenuProps) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { state: bookmarkState, toggleBookmark, isPending: isBookmarkPending } =
    useReviewBookmark({
      reviewId,
      initialState: {
        bookmarked: initialBookmarked,
      },
    });
  const {
    canOpenTrack,
    confirmOpen,
    setConfirmOpen,
    isDeleting,
    openTrack,
    copyReviewLink,
    reportReview,
    requestDeleteReview,
    deleteReview,
  } = useReviewActions({
    reviewId,
    reviewTitle,
    entityTitle,
    entityId,
    reviewPath,
    entityPath,
  });

  async function handleBookmarkToggle() {
    if (!isAuthenticated) {
      setMenuOpen(false);
      toastAuthRequired("bookmark");
      return;
    }

    try {
      await toggleBookmark();
      setMenuOpen(false);
    } catch (error) {
      toastActionError(error, "We couldn't update your saved reviews right now.");
    }
  }

  const actionTrigger = trigger ?? (
    <button
      type="button"
      className="flex size-11 items-center justify-center rounded-full border-0 bg-transparent p-0 text-muted-foreground/82 transition-[color,transform] duration-150 hover:text-foreground active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65 md:size-10"
      aria-label="Review actions"
    >
      <KocteauMoreIcon className="size-[1.1rem]" />
    </button>
  );

  const actionList = (
    <div className="space-y-1">
      <button
        type="button"
        className={actionClassName}
        onClick={() => {
          setMenuOpen(false);
          void copyReviewLink();
        }}
      >
        <KocteauCopyIcon className="size-[1.05rem]" />
        Copy review link
      </button>

      {canOpenTrack ? (
        <button
          type="button"
          className={actionClassName}
          onClick={() => {
            setMenuOpen(false);
            openTrack();
          }}
        >
          <KocteauSongIcon className="size-[1.05rem]" />
          Open track
        </button>
      ) : null}

      <button
        type="button"
        disabled={isBookmarkPending}
        className={actionClassName}
        onClick={() => void handleBookmarkToggle()}
      >
        <KocteauBookmarkIcon
          className="size-[1.05rem]"
          weight={bookmarkState.bookmarked ? "fill" : "regular"}
        />
        {bookmarkState.bookmarked ? "Saved" : "Save"}
      </button>

      <div role="separator" className="mx-2 my-1.5 h-px bg-border/24" />

      {canManage ? (
        <>
          {editSeed ? (
            <button
              type="button"
              className={actionClassName}
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
            >
              <KocteauEditIcon className="size-[1.05rem]" />
              Edit review
            </button>
          ) : null}
          <button
            type="button"
            className={cn(actionClassName, "text-destructive hover:bg-destructive/[0.08] hover:text-destructive")}
            onClick={() => {
              setMenuOpen(false);
              requestDeleteReview();
            }}
          >
            <KocteauTrashIcon className="size-[1.05rem]" />
            Delete review
          </button>
        </>
      ) : (
        <button
          type="button"
          className={actionClassName}
          onClick={() => {
            setMenuOpen(false);
            void reportReview();
          }}
        >
          <KocteauFlagIcon className="size-[1.05rem]" />
          Report
        </button>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
          <DrawerTrigger asChild>{actionTrigger}</DrawerTrigger>
          <DrawerContent className="p-0 text-foreground before:inset-0 before:rounded-t-[1.35rem] before:border-x before:border-b-0 before:border-t before:border-border/30 before:bg-background">
            <DrawerHeader className="px-5 pb-2 pt-4 text-left">
              <DrawerTitle>Review actions</DrawerTitle>
              <DrawerDescription className="sr-only">
                Save, share, edit, or report this review.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">{actionList}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogTrigger asChild>{actionTrigger}</DialogTrigger>
          <DialogContent
            showCloseButton={false}
            className="w-[22rem] max-w-[calc(100%_-_2rem)] gap-0 rounded-[1.2rem] border-border/28 bg-background p-2 shadow-none"
          >
            <DialogHeader className="px-3 pb-2 pt-2">
              <DialogTitle>Review actions</DialogTitle>
              <DialogDescription className="sr-only">
                Save, share, edit, or report this review.
              </DialogDescription>
            </DialogHeader>
            {actionList}
          </DialogContent>
        </Dialog>
      )}

      <ReviewDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        isDeleting={isDeleting}
        onConfirm={deleteReview}
      />

      {editSeed ? (
        <EditReviewDialog
          reviewId={reviewId}
          {...editSeed}
          open={editOpen}
          onOpenChange={setEditOpen}
          showTrigger={false}
        />
      ) : null}
    </>
  );
}
