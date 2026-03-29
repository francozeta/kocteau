"use client";

import type { Ref } from "react";
import ReviewBookmarkButton from "@/components/review-bookmark-button";
import ReviewCommentsButton from "@/components/review-comments-button";
import ReviewLikeButton from "@/components/review-like-button";
import type { ReviewCardData } from "@/components/review-card";

type ReviewCardInteractionBarProps = {
  review: ReviewCardData;
  isAuthenticated?: boolean;
  bookmarkButtonRef?: Ref<HTMLButtonElement>;
};

export default function ReviewCardInteractionBar({
  review,
  isAuthenticated = false,
  bookmarkButtonRef,
}: ReviewCardInteractionBarProps) {
  return (
    <div className="flex items-center gap-0.5">
      <ReviewLikeButton
        reviewId={review.id}
        initialCount={review.likes_count}
        initialLiked={Boolean(review.viewer_has_liked)}
        isAuthenticated={isAuthenticated}
      />
      <ReviewCommentsButton
        reviewId={review.id}
        initialCount={review.comments_count}
        isAuthenticated={isAuthenticated}
      />
      <ReviewBookmarkButton
        reviewId={review.id}
        initialBookmarked={Boolean(review.viewer_has_bookmarked)}
        isAuthenticated={isAuthenticated}
        buttonRef={bookmarkButtonRef}
      />
    </div>
  );
}
