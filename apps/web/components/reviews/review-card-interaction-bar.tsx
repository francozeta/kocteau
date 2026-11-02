"use client";

import type { Ref } from "react";
import ReviewBookmarkButton from "@/components/reviews/review-bookmark-button";
import ReviewCommentsButton from "@/components/reviews/review-comments-button";
import ReviewLikeButton from "@/components/reviews/review-like-button";

type ReviewCardInteractionBarProps = {
  reviewId: string;
  likesCount: number;
  commentsCount: number;
  viewerHasLiked: boolean;
  viewerHasBookmarked: boolean;
  isAuthenticated?: boolean;
  bookmarkButtonRef?: Ref<HTMLButtonElement>;
  analyticsSource?: string | null;
  commentInlineTarget?: {
    targetId: string;
    composerId?: string;
  } | null;
  viewer?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function ReviewCardInteractionBar({
  reviewId,
  likesCount,
  commentsCount,
  viewerHasLiked,
  viewerHasBookmarked,
  isAuthenticated = false,
  bookmarkButtonRef,
  analyticsSource = null,
  commentInlineTarget = null,
  viewer = null,
}: ReviewCardInteractionBarProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-[color-mix(in_oklch,var(--foreground)_7%,transparent)] p-1">
      <ReviewLikeButton
        reviewId={reviewId}
        initialCount={likesCount}
        initialLiked={viewerHasLiked}
        isAuthenticated={isAuthenticated}
        analyticsSource={analyticsSource}
      />
      <ReviewCommentsButton
        reviewId={reviewId}
        initialCount={commentsCount}
        isAuthenticated={isAuthenticated}
        analyticsSource={analyticsSource}
        viewer={viewer}
        inlineTarget={commentInlineTarget}
      />
      <ReviewBookmarkButton
        reviewId={reviewId}
        initialBookmarked={viewerHasBookmarked}
        isAuthenticated={isAuthenticated}
        buttonRef={bookmarkButtonRef}
        analyticsSource={analyticsSource}
      />
    </div>
  );
}
