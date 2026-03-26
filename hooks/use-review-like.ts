"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type ReviewLikeState = {
  liked: boolean;
  count: number;
};

type UseReviewLikeOptions = {
  reviewId: string;
  initialState: ReviewLikeState;
};

export function useReviewLike({
  reviewId,
  initialState,
}: UseReviewLikeOptions) {
  const queryClient = useQueryClient();
  const previousInitialState = useRef(initialState);
  const queryKey = useMemo(
    () => ["review-like-state", reviewId] as const,
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
    const cached = queryClient.getQueryData<ReviewLikeState>(queryKey);
    const serverSnapshotChanged =
      previousInitialState.current.count !== initialState.count ||
      previousInitialState.current.liked !== initialState.liked;

    if (!cached || serverSnapshotChanged) {
      queryClient.setQueryData<ReviewLikeState>(queryKey, initialState);
    }

    previousInitialState.current = initialState;
  }, [initialState, queryClient, queryKey]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; liked?: boolean; likesCount?: number }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "We couldn't update your like right now.");
      }

      return {
        liked: payload?.liked ?? false,
        count: payload?.likesCount ?? 0,
      } satisfies ReviewLikeState;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<ReviewLikeState>(queryKey) ?? initialState;
      const next = {
        liked: !previous.liked,
        count: Math.max(previous.count + (previous.liked ? -1 : 1), 0),
      } satisfies ReviewLikeState;

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
    toggleLike: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
