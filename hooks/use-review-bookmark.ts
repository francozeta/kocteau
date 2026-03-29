"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  syncReviewBookmarkState,
  type ReviewBookmarkState,
  viewerKeys,
} from "@/queries/viewer";

type UseReviewBookmarkOptions = {
  reviewId: string;
  initialState: ReviewBookmarkState;
};

export function useReviewBookmark({
  reviewId,
  initialState,
}: UseReviewBookmarkOptions) {
  const queryClient = useQueryClient();
  const previousInitialState = useRef(initialState);
  const queryKey = viewerKeys.reviewBookmark(reviewId);

  const { data: state } = useQuery({
    queryKey,
    queryFn: async () => initialState,
    initialData: initialState,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    const cached = queryClient.getQueryData<ReviewBookmarkState>(queryKey);
    const serverSnapshotChanged =
      previousInitialState.current.bookmarked !== initialState.bookmarked;

    if (!cached || serverSnapshotChanged) {
      syncReviewBookmarkState(queryClient, reviewId, initialState);
    }

    previousInitialState.current = initialState;
  }, [initialState, queryClient, queryKey, reviewId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/reviews/${reviewId}/bookmark`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; bookmarked?: boolean }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ?? "We couldn't update your saved reviews right now.",
        );
      }

      return {
        bookmarked: payload?.bookmarked ?? false,
      } satisfies ReviewBookmarkState;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<ReviewBookmarkState>(queryKey) ?? initialState;
      const next = {
        bookmarked: !previous.bookmarked,
      } satisfies ReviewBookmarkState;

      syncReviewBookmarkState(queryClient, reviewId, next);

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        syncReviewBookmarkState(queryClient, reviewId, context.previous);
      }
    },
    onSuccess: (nextState) => {
      syncReviewBookmarkState(queryClient, reviewId, nextState);
    },
  });

  return {
    state,
    toggleBookmark: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
