"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { KocteauCommentIcon } from "@/components/icons/kocteau-icons";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReviewComments } from "@/hooks/use-review-comments";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";

// Keep Vaul/Radix, the composer and comment panel out of the initial review
// list bundle. Dynamic import from a Client Component enables code splitting.
const ReviewCommentsOverlay = dynamic(
  () => import("@/components/reviews/review-comments-overlay"),
  {
    ssr: false,
    loading: () => <span className="sr-only" role="status">Opening comments</span>,
  },
);

function preloadCommentsOverlay() {
  void import("@/components/reviews/review-comments-overlay");
}

type ReviewCommentsButtonProps = {
  reviewId: string;
  initialCount: number;
  isAuthenticated: boolean;
  analyticsSource?: string | null;
  viewer?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  inlineTarget?: {
    targetId: string;
    composerId?: string;
  } | null;
};

export default function ReviewCommentsButton({
  reviewId,
  initialCount,
  isAuthenticated,
  analyticsSource = null,
  viewer = null,
  inlineTarget = null,
}: ReviewCommentsButtonProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const { commentsCount } = useReviewComments({
    reviewId,
    initialCount,
    enabled: open,
  });
  const commentsDescription =
    commentsCount > 0
      ? `${commentsCount} ${commentsCount === 1 ? "reply" : "replies"}`
      : "No replies yet";

  function handleTriggerClick() {
    if (inlineTarget) {
      const target = document.getElementById(inlineTarget.targetId);
      target?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      const composerId = inlineTarget.composerId;
      if (isAuthenticated && composerId && !isMobile) {
        window.requestAnimationFrame(() => {
          document.getElementById(composerId)?.focus();
        });
      }
      return;
    }

    if (!isAuthenticated) {
      toastAuthRequired("comment");
      return;
    }

    const nextOpen = !open;
    if (nextOpen) {
      setHasOpened(true);
      if (analyticsSource === "feed:for-you") {
        trackAnalyticsEvent({
          eventType: "for_you_review_action",
          source: analyticsSource,
          metadata: {
            action: "open_comments",
            review_id: reviewId,
          },
        });
      }
    }
    setOpen(nextOpen);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTriggerClick}
        onPointerEnter={!inlineTarget && isAuthenticated ? preloadCommentsOverlay : undefined}
        onFocus={!inlineTarget && isAuthenticated ? preloadCommentsOverlay : undefined}
        aria-label={inlineTarget ? "Reply to this review" : open ? "Close comments" : "Open comments"}
        aria-expanded={inlineTarget ? undefined : open}
        className={cn(
          "inline-flex min-h-8 items-center gap-1 rounded-md border border-transparent px-2 py-1 text-[11px] font-medium text-muted-foreground/88 transition-[color,background-color,transform] duration-150 hover:bg-foreground/[0.055] hover:text-foreground active:scale-[0.96]",
          open && "text-foreground",
        )}
      >
        <KocteauCommentIcon className="size-4" />
        {commentsCount > 0 ? <span>{commentsCount}</span> : null}
      </button>
      {hasOpened && !inlineTarget ? (
        <ReviewCommentsOverlay
          reviewId={reviewId}
          initialCount={initialCount}
          isAuthenticated={isAuthenticated}
          open={open}
          onOpenChange={setOpen}
          isMobile={isMobile}
          commentsDescription={commentsDescription}
          viewer={viewer}
        />
      ) : null}
    </>
  );
}
