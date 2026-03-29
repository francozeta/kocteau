"use client";

import { Bookmark, CornerUpRight, Flag, Music2, PencilLine, TextQuote, Trash2 } from "lucide-react";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  ReviewCardDeleteDialog,
  useReviewCardActions,
} from "@/components/review-card-actions";

type ReviewCardContextMenuProps = {
  reviewId: string;
  reviewTitle: string | null;
  entityTitle: string | null;
  entityId?: string | null;
  canManage?: boolean;
  onToggleBookmark?: () => void;
};

export default function ReviewCardContextMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  canManage = false,
  onToggleBookmark,
}: ReviewCardContextMenuProps) {
  const {
    canOpenTrack,
    confirmOpen,
    setConfirmOpen,
    isDeleting,
    openReview,
    openTrack,
    editReview,
    copyReviewLink,
    requestDeleteReview,
    reportReview,
    deleteReview,
  } = useReviewCardActions({
    reviewId,
    reviewTitle,
    entityTitle,
    entityId,
  });

  return (
    <>
      <ContextMenuContent className="w-48 rounded-xl border-border/30 bg-popover/96 p-1.5 shadow-xl">
        <ContextMenuLabel>Review</ContextMenuLabel>
        <ContextMenuItem onSelect={openReview}>
          <CornerUpRight className="size-4" />
          Open review
          <ContextMenuShortcut>O</ContextMenuShortcut>
        </ContextMenuItem>
        {canOpenTrack ? (
          <ContextMenuItem onSelect={openTrack}>
            <Music2 className="size-4" />
            Open track
            <ContextMenuShortcut>T</ContextMenuShortcut>
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem
          onSelect={() => {
            void copyReviewLink();
          }}
        >
          <TextQuote className="size-4" />
          Copy review link
          <ContextMenuShortcut>⇧L</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            onToggleBookmark?.();
          }}
        >
          <Bookmark className="size-4" />
          Bookmark
          <ContextMenuShortcut>B</ContextMenuShortcut>
        </ContextMenuItem>

        {canManage ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={editReview}>
              <PencilLine className="size-4" />
              Edit review
              <ContextMenuShortcut>E</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault();
                requestDeleteReview();
              }}
            >
              <Trash2 className="size-4" />
              Delete review
              <ContextMenuShortcut>Del</ContextMenuShortcut>
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
              <ContextMenuShortcut>R</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>

      <ReviewCardDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        isDeleting={isDeleting}
        onConfirm={deleteReview}
      />
    </>
  );
}
