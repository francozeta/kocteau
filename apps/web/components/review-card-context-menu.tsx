"use client";

import { useState } from "react";
import { Bookmark, Flag, Music2, PencilLine, TextQuote, Trash2 } from "lucide-react";
import EditReviewDialog, { type EditReviewDialogSeed } from "@/components/edit-review-dialog";
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
  onToggleBookmark?: () => void;
  editSeed?: EditReviewDialogSeed | null;
};

export default function ReviewCardContextMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  canManage = false,
  onToggleBookmark,
  editSeed = null,
}: ReviewCardContextMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
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

  return (
    <>
      <ContextMenuContent className="w-48 rounded-xl border-border/30 bg-popover/96 p-1.5 shadow-xl">
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
          onSelect={() => {
            onToggleBookmark?.();
          }}
        >
          <Bookmark className="size-4" />
          Bookmark
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
