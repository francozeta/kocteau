"use client";

import { useState, type ReactNode } from "react";
import { Bookmark, Flag, MoreHorizontal, Music2, PencilLine, TextQuote, Trash2 } from "lucide-react";
import EditReviewDialog, { type EditReviewDialogSeed } from "@/components/edit-review-dialog";
import { useReviewBookmark } from "@/hooks/use-review-bookmark";
import { toastActionError, toastAuthRequired } from "@/lib/feedback";
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
  trigger?: ReactNode;
  editSeed?: EditReviewDialogSeed | null;
  initialBookmarked?: boolean;
  isAuthenticated?: boolean;
};

export default function ReviewCardActionsMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  canManage = false,
  trigger,
  editSeed = null,
  initialBookmarked = false,
  isAuthenticated = false,
}: ReviewCardActionsMenuProps) {
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
  });

  async function handleBookmarkToggle() {
    if (!isAuthenticated) {
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
          className="w-44 min-w-44 rounded-xl border-border/42 bg-popover/98 p-1.5 shadow-xl shadow-black/30 md:border-border/30 md:bg-popover/96"
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

          <DropdownMenuItem
            disabled={isBookmarkPending}
            onSelect={(event) => {
              event.preventDefault();
              void handleBookmarkToggle();
            }}
          >
            <Bookmark className="size-4" />
            {bookmarkState.bookmarked ? "Saved" : "Save"}
          </DropdownMenuItem>

          {canManage ? (
            <>
              <DropdownMenuSeparator />
              {editSeed ? (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                >
                  <PencilLine className="size-4" />
                  Edit review
                </DropdownMenuItem>
              ) : null}
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
