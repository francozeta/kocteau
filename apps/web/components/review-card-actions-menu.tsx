"use client";

import { useState, type ReactNode } from "react";
import { Bookmark, Flag, MoreHorizontal, Music2, PencilLine, TextQuote, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ReviewDeleteDialog,
  type ReviewActionTarget,
  useReviewActions,
} from "@/components/review-actions";

type ReviewCardActionsMenuProps = ReviewActionTarget & {
  canManage?: boolean;
  onToggleBookmark?: () => void;
  trigger?: ReactNode;
};

export default function ReviewCardActionsMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  canManage = false,
  onToggleBookmark,
  trigger,
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
  } = useReviewActions({
    reviewId,
    reviewTitle,
    entityTitle,
    entityId,
  });

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-full border border-transparent bg-transparent text-muted-foreground/82 hover:bg-muted/22 hover:text-foreground"
              aria-label="Review actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          )}
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
          </DropdownMenuItem>

          {canOpenTrack ? (
            <DropdownMenuItem
              onSelect={() => {
                openTrack();
              }}
            >
              <Music2 className="size-4" />
              Open track
            </DropdownMenuItem>
          ) : null}

          {onToggleBookmark ? (
            <DropdownMenuItem
              onSelect={() => {
                onToggleBookmark();
              }}
            >
              <Bookmark className="size-4" />
              Bookmark
            </DropdownMenuItem>
          ) : null}

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
                  requestDeleteReview();
                }}
              >
                <Trash2 className="size-4" />
                Delete review
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
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReviewDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        isDeleting={isDeleting}
        onConfirm={deleteReview}
      />
    </>
  );
}
