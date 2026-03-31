"use client";

import { useEffect, useRef } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  syncReviewLikeState,
  type ReviewLikeState,
  viewerKeys,
} from "@/queries/viewer";

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
  const queryKey = viewerKeys.reviewLike(reviewId);

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
      syncReviewLikeState(queryClient, reviewId, initialState);
    }

    previousInitialState.current = initialState;
  }, [initialState, queryClient, queryKey, reviewId]);

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

      syncReviewLikeState(queryClient, reviewId, next);

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        syncReviewLikeState(queryClient, reviewId, context.previous);
      }
    },
    onSuccess: (nextState) => {
      syncReviewLikeState(queryClient, reviewId, nextState);
    },
  });

  return {
    state,
    toggleLike: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
