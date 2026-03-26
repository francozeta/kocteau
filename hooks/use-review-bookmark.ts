"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ReviewBookmarkState = {
  bookmarked: boolean;
};

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
  const queryKey = useMemo(
    () => ["review-bookmark-state", reviewId] as const,
    [reviewId],
  );

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
      queryClient.setQueryData<ReviewBookmarkState>(queryKey, initialState);
    }

    previousInitialState.current = initialState;
  }, [initialState, queryClient, queryKey]);

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

      queryClient.setQueryData(queryKey, next);

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (nextState) => {
      queryClient.setQueryData(queryKey, nextState);
    },
  });

  return {
    state,
    toggleBookmark: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
