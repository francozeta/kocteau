"use client";

import { useQuery } from "@tanstack/react-query";
import { SavedReviewCard } from "@/components/review-route-cards";
import {
  type ViewerSavedReview,
  viewerSavedReviewsQueryOptions,
} from "@/queries/viewer";

type SavedReviewsListProps = {
  initialReviews: ViewerSavedReview[];
  userId: string;
  isAuthenticated: boolean;
  emptyState: React.ReactNode;
};

function getAuthor(review: ViewerSavedReview["review"]) {
  if (!review?.author) {
    return null;
  }

  if (Array.isArray(review.author)) {
    return review.author[0] ?? null;
  }

  return review.author;
}

function getEntity(review: ViewerSavedReview["review"]) {
  if (!review?.entities) {
    return null;
  }

  if (Array.isArray(review.entities)) {
    return review.entities[0] ?? null;
  }

  return review.entities;
}

export default function SavedReviewsList({
  initialReviews,
  userId,
  isAuthenticated,
  emptyState,
}: SavedReviewsListProps) {
  const { data: savedReviews = initialReviews } = useQuery({
    ...viewerSavedReviewsQueryOptions(),
    initialData: initialReviews,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  if (savedReviews.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="space-y-4">
      {savedReviews.map((savedReview) => {
        if (!savedReview.review) {
          return null;
        }

        const reviewAuthor = getAuthor(savedReview.review);
        const reviewEntity = getEntity(savedReview.review);

        return (
          <SavedReviewCard
            key={savedReview.review.id}
            review={savedReview.review}
            entity={reviewEntity}
            author={reviewAuthor}
            isAuthenticated={isAuthenticated}
            canManage={reviewAuthor?.id === userId}
          />
        );
      })}
    </div>
  );
}
