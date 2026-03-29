"use client";

import { useState } from "react";
import { MoreHorizontal, PencilLine, Share2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ReviewCardDeleteDialog,
  useReviewCardActions,
} from "@/components/review-card-actions";

type ReviewCardActionsMenuProps = {
  reviewId: string;
  reviewTitle: string | null;
  entityTitle: string | null;
  entityId?: string | null;
  canManage?: boolean;
};

export default function ReviewCardActionsMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  canManage = false,
}: ReviewCardActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    confirmOpen,
    setConfirmOpen,
    isDeleting,
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
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full border border-border/18 bg-muted/12 text-muted-foreground hover:bg-muted/24 hover:text-foreground"
            aria-label="Review actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-44 min-w-44 rounded-xl border-border/30 bg-popover/96 p-1.5 shadow-xl"
          sideOffset={8}
        >
          <DropdownMenuItem
            onSelect={() => {
              void shareReview();
            }}
          >
            <Share2 className="size-4" />
            Share review
          </DropdownMenuItem>

          {canManage ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  editReview();
                }}
              >
                <PencilLine className="size-4" />
                Edit review
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="size-4" />
                Delete review
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReviewCardDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        isDeleting={isDeleting}
        onConfirm={deleteReview}
      />
    </>
  );
}
