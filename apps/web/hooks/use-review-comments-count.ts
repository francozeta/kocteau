"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewKeys } from "@/queries/reviews";
import { syncReviewCommentsCount } from "@/queries/viewer";

// A closed comment button only needs the shared count, not the full comment
// query, posting/deletion mutations or composer state. The full hook remains
// behind the on-demand ReviewCommentsPanel.
export function useReviewCommentsCount({
  reviewId,
  initialCount,
}: {
  reviewId: string;
  initialCount: number;
}) {
  const queryClient = useQueryClient();
  const countKey = reviewKeys.commentsCount(reviewId);
  const previousInitialCount = useRef(initialCount);
  const countQuery = useQuery({
    queryKey: countKey,
    queryFn: async () => initialCount,
    initialData: initialCount,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    const serverSnapshotChanged = previousInitialCount.current !== initialCount;
    if (serverSnapshotChanged || queryClient.getQueryData<number>(countKey) === undefined) {
      syncReviewCommentsCount(queryClient, reviewId, initialCount);
    }
    previousInitialCount.current = initialCount;
  }, [countKey, initialCount, queryClient, reviewId]);

  return countQuery.data ?? initialCount;
}
