"use client";

import type { ReactNode } from "react";
import type { EditReviewDialogSeed } from "@/components/edit-review-dialog";
import ReviewCardContextMenu from "@/components/review-card-context-menu";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";

type ReviewCardContextMenuFrameProps = {
  children: ReactNode;
  reviewId: string;
  reviewTitle: string | null;
  entityTitle: string | null;
  entityId?: string | null;
  reviewPath?: string | null;
  entityPath?: string | null;
  canManage?: boolean;
  editSeed?: EditReviewDialogSeed | null;
  initialBookmarked?: boolean;
  isAuthenticated?: boolean;
};

export default function ReviewCardContextMenuFrame({
  children,
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  reviewPath = null,
  entityPath = null,
  canManage = false,
  editSeed = null,
  initialBookmarked = false,
  isAuthenticated = false,
}: ReviewCardContextMenuFrameProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="kocteau-review-card-frame h-full">{children}</div>
      </ContextMenuTrigger>
      <ReviewCardContextMenu
        reviewId={reviewId}
        reviewTitle={reviewTitle}
        entityTitle={entityTitle}
        entityId={entityId}
        reviewPath={reviewPath}
        entityPath={entityPath}
        canManage={canManage}
        editSeed={editSeed}
        initialBookmarked={initialBookmarked}
        isAuthenticated={isAuthenticated}
      />
    </ContextMenu>
  );
}
