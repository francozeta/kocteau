"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  syncReviewBookmarkState,
  syncReviewLikeState,
} from "@/queries/viewer";

type ProfileReviewViewerStateHydratorProps = {
  reviews: Array<{
    id: string;
    likes_count: number;
  }>;
};

type ViewerReviewCollectionStatePayload = {
  likedReviewIds?: string[];
  bookmarkedReviewIds?: string[];
};

export default function ProfileReviewViewerStateHydrator({
  reviews,
}: ProfileReviewViewerStateHydratorProps) {
  const queryClient = useQueryClient();
  const reviewIds = reviews.map((review) => review.id);

  const { data } = useQuery({
    queryKey: ["viewer", "review-collection-state", reviewIds],
    queryFn: async () => {
      const response = await fetch("/api/viewer/review-collection-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewIds }),
      });

      if (!response.ok) {
        throw new Error("We couldn't load your review state right now.");
      }

      return (await response.json()) as ViewerReviewCollectionStatePayload;
    },
    enabled: reviewIds.length > 0,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    const likedIds = new Set(data.likedReviewIds ?? []);
    const bookmarkedIds = new Set(data.bookmarkedReviewIds ?? []);

    for (const review of reviews) {
      syncReviewLikeState(queryClient, review.id, {
        liked: likedIds.has(review.id),
        count: review.likes_count,
      });
      syncReviewBookmarkState(queryClient, review.id, {
        bookmarked: bookmarkedIds.has(review.id),
      });
    }
  }, [data, queryClient, reviews]);

  return null;
}
