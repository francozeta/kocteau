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

        const reviewAuthor = savedReview.review.author;
        const reviewEntity = savedReview.review.entities;

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
