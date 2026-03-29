"use client";

import { CornerUpRight, Music2, PencilLine, Share2, Trash2 } from "lucide-react";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
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
};

export default function ReviewCardContextMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  canManage = false,
}: ReviewCardContextMenuProps) {
  const {
    canOpenTrack,
    confirmOpen,
    setConfirmOpen,
    isDeleting,
    openReview,
    openTrack,
    editReview,
    shareReview,
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
        </ContextMenuItem>
        {canOpenTrack ? (
          <ContextMenuItem onSelect={openTrack}>
            <Music2 className="size-4" />
            Open track
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem
          onSelect={() => {
            void shareReview();
          }}
        >
          <Share2 className="size-4" />
          Share review
        </ContextMenuItem>

        {canManage ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={editReview}>
              <PencilLine className="size-4" />
              Edit review
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault();
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="size-4" />
              Delete review
            </ContextMenuItem>
          </>
        ) : null}
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
