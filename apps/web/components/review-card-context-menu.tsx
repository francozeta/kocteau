"use client";

import { useState } from "react";
import { Bookmark, Flag, Music2, PencilLine, TextQuote, Trash2 } from "lucide-react";
import EditReviewDialog, { type EditReviewDialogSeed } from "@/components/edit-review-dialog";
import { useReviewBookmark } from "@/hooks/use-review-bookmark";
import { toastActionError, toastAuthRequired } from "@/lib/feedback";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  ReviewDeleteDialog,
  type ReviewActionTarget,
  useReviewActions,
} from "@/components/review-actions";

type ReviewCardContextMenuProps = ReviewActionTarget & {
  canManage?: boolean;
  editSeed?: EditReviewDialogSeed | null;
  initialBookmarked?: boolean;
  isAuthenticated?: boolean;
};

export default function ReviewCardContextMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  canManage = false,
  editSeed = null,
  initialBookmarked = false,
  isAuthenticated = false,
}: ReviewCardContextMenuProps) {
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
    requestDeleteReview,
    reportReview,
    deleteReview,
  } = useReviewActions({
    reviewId,
    reviewTitle,
    entityTitle,
    entityId,
  });

  async function handleBookmarkToggle() {
    if (!isAuthenticated) {
      toastAuthRequired("bookmark");
      return;
    }

    try {
      await toggleBookmark();
    } catch (error) {
      toastActionError(error, "We couldn't update your saved reviews right now.");
    }
  }

  return (
    <>
      <ContextMenuContent className="w-48 rounded-xl border-border/42 bg-popover/98 p-1.5 shadow-xl shadow-black/30 md:border-border/30 md:bg-popover/96">
        <ContextMenuLabel>Review</ContextMenuLabel>
        {canOpenTrack ? (
          <ContextMenuItem onSelect={openTrack}>
            <Music2 className="size-4" />
            Open track
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem
          onSelect={() => {
            void copyReviewLink();
          }}
        >
          <TextQuote className="size-4" />
          Copy review link
        </ContextMenuItem>
        <ContextMenuItem
          disabled={isBookmarkPending}
          onSelect={(event) => {
            event.preventDefault();
            void handleBookmarkToggle();
          }}
        >
          <Bookmark className="size-4" />
          {bookmarkState.bookmarked ? "Saved" : "Save"}
        </ContextMenuItem>

        {canManage ? (
          <>
            <ContextMenuSeparator />
            {editSeed ? (
              <ContextMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setEditOpen(true);
                }}
              >
                <PencilLine className="size-4" />
                Edit review
              </ContextMenuItem>
            ) : null}
            <ContextMenuItem
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault();
                requestDeleteReview();
              }}
            >
              <Trash2 className="size-4" />
              Delete review
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => {
                void reportReview();
              }}
            >
              <Flag className="size-4" />
              Report
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>

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
