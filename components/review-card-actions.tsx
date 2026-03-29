"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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

type UseReviewCardActionsOptions = {
  reviewId: string;
  reviewTitle: string | null;
  entityTitle: string | null;
  entityId?: string | null;
};

export function useReviewCardActions({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
}: UseReviewCardActionsOptions) {
  const router = useRouter();
  const pathname = usePathname();
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

  function openReview() {
    router.prefetch(`/review/${reviewId}`);
    router.push(`/review/${reviewId}`);
  }

  function openTrack() {
    if (!entityId) {
      return;
    }

    router.prefetch(`/track/${entityId}`);
    router.push(`/track/${entityId}`);
  }

  function editReview() {
    router.prefetch(`/review/${reviewId}?edit=1`);
    router.push(`/review/${reviewId}?edit=1`);
  }

  async function shareReview() {
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

  async function deleteReview() {
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

  return {
    canOpenTrack: Boolean(entityId),
    confirmOpen,
    setConfirmOpen,
    isDeleting,
    openReview,
    openTrack,
    editReview,
    shareReview,
    deleteReview,
  };
}

export function ReviewCardDeleteDialog({
  open,
  onOpenChange,
  isDeleting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
              void onConfirm();
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
