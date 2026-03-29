"use client";

import { useState } from "react";
import { Bookmark, Flag, MoreHorizontal, Music2, PencilLine, TextQuote, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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
  onToggleBookmark?: () => void;
};

export default function ReviewCardActionsMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  canManage = false,
  onToggleBookmark,
}: ReviewCardActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    canOpenTrack,
    confirmOpen,
    setConfirmOpen,
    isDeleting,
    openTrack,
    editReview,
    copyReviewLink,
    reportReview,
    requestDeleteReview,
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
            className="size-7 rounded-full border border-transparent bg-transparent text-muted-foreground/82 hover:bg-muted/22 hover:text-foreground"
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
              void copyReviewLink();
            }}
          >
            <TextQuote className="size-4" />
            Copy review link
            <DropdownMenuShortcut>⇧L</DropdownMenuShortcut>
          </DropdownMenuItem>

          {canOpenTrack ? (
            <DropdownMenuItem
              onSelect={() => {
                openTrack();
              }}
            >
              <Music2 className="size-4" />
              Open track
              <DropdownMenuShortcut>T</DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem
            onSelect={() => {
              onToggleBookmark?.();
            }}
          >
            <Bookmark className="size-4" />
            Bookmark
            <DropdownMenuShortcut>B</DropdownMenuShortcut>
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
                <DropdownMenuShortcut>E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setMenuOpen(false);
                  requestDeleteReview();
                }}
              >
                <Trash2 className="size-4" />
                Delete review
                <DropdownMenuShortcut>Del</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void reportReview();
                }}
              >
                <Flag className="size-4" />
                Report
                <DropdownMenuShortcut>R</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
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
