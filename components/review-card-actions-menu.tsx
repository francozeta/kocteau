"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Share2, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toastActionError, toastActionSuccess } from "@/lib/feedback";
import { createApiError } from "@/lib/validation/errors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ReviewCardActionsMenuProps = {
  reviewId: string;
  reviewTitle: string | null;
  entityTitle: string | null;
  canManage?: boolean;
};

export default function ReviewCardActionsMenu({
  reviewId,
  reviewTitle,
  entityTitle,
  canManage = false,
}: ReviewCardActionsMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const shareLabel = useMemo(() => {
    const trimmedTitle = reviewTitle?.trim();

    if (trimmedTitle) {
      return trimmedTitle;
    }

    if (entityTitle?.trim()) {
      return `${entityTitle} review`;
    }

    return "Kocteau review";
  }, [entityTitle, reviewTitle]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URL(`/review/${reviewId}`, window.location.origin).toString();
  }, [reviewId]);

  async function handleShare() {
    try {
      if (!shareUrl) {
        throw new Error("Sharing isn't available right now.");
      }

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: shareLabel,
            text: shareLabel,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toastActionSuccess("Review link copied");
        return;
      }

      throw new Error("Sharing isn't available on this device right now.");
    } catch (error) {
      toastActionError(error, "We couldn't share this review right now.");
    }
  }

  async function handleDeleteReview() {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw await createApiError(
          response,
          "We couldn't delete this review right now.",
        );
      }

      const payload = (await response.json().catch(() => null)) as
        | {
            entityId?: string | null;
            username?: string | null;
          }
        | null;

      toastActionSuccess("Review deleted");
      setConfirmOpen(false);

      if (pathname === `/review/${reviewId}`) {
        if (payload?.entityId) {
          router.replace(`/track/${payload.entityId}`);
        } else if (payload?.username) {
          router.replace(`/u/${payload.username}`);
        } else {
          router.replace("/");
        }
        return;
      }

      router.refresh();
    } catch (error) {
      toastActionError(error, "We couldn't delete this review right now.");
    } finally {
      setIsDeleting(false);
    }
  }

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
              void handleShare();
            }}
          >
            <Share2 className="size-4" />
            Share review
          </DropdownMenuItem>

          {canManage ? (
            <>
              <DropdownMenuSeparator />
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm" className="rounded-[1.4rem] border border-border/25 bg-background/98">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/14 text-destructive">
              <Trash2 className="size-4" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete review?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the review, its likes, comments, bookmarks, and related notifications. The track page stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteReview();
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
