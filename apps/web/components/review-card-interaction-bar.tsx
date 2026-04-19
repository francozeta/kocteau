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
  analyticsSource?: string | null;
  viewer?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function ReviewCardInteractionBar({
  review,
  isAuthenticated = false,
  bookmarkButtonRef,
  analyticsSource = null,
  viewer = null,
}: ReviewCardInteractionBarProps) {
  return (
    <div className="flex items-center gap-0.5">
      <ReviewLikeButton
        reviewId={review.id}
        initialCount={review.likes_count}
        initialLiked={Boolean(review.viewer_has_liked)}
        isAuthenticated={isAuthenticated}
        analyticsSource={analyticsSource}
      />
      <ReviewCommentsButton
        reviewId={review.id}
        initialCount={review.comments_count}
        isAuthenticated={isAuthenticated}
        analyticsSource={analyticsSource}
        viewer={viewer}
      />
      <ReviewBookmarkButton
        reviewId={review.id}
        initialBookmarked={Boolean(review.viewer_has_bookmarked)}
        isAuthenticated={isAuthenticated}
        buttonRef={bookmarkButtonRef}
        analyticsSource={analyticsSource}
      />
    </div>
  );
}
