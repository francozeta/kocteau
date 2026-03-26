"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ReviewCommentAuthor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ReviewComment = {
  id: string;
  review_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author: ReviewCommentAuthor | ReviewCommentAuthor[] | null;
  is_owner: boolean;
  optimistic?: boolean;
};

type UseReviewCommentsOptions = {
  reviewId: string;
  initialCount: number;
  enabled?: boolean;
};

type CommentMutationResponse = {
  reviewId: string;
  commentsCount: number;
};

type CreateCommentResponse = CommentMutationResponse & {
  comment: ReviewComment;
};

type DeleteCommentResponse = CommentMutationResponse & {
  commentId: string;
};

export function useReviewComments({
  reviewId,
  initialCount,
  enabled = false,
}: UseReviewCommentsOptions) {
  const queryClient = useQueryClient();
  const previousInitialCount = useRef(initialCount);
  const commentsKey = useMemo(
    () => ["review-comments", reviewId] as const,
    [reviewId],
  );
  const countKey = useMemo(
    () => ["review-comments-count", reviewId] as const,
    [reviewId],
  );

  function syncCommentsCount(nextCount: number) {
    queryClient.setQueryData<number>(countKey, nextCount);
  }

  const commentsQuery = useQuery({
    queryKey: commentsKey,
    queryFn: async () => {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        cache: "no-store",
      });

      if (response.status === 503) {
        return [] as ReviewComment[];
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; comments?: ReviewComment[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "We couldn't load comments right now.");
      }

      return Array.isArray(payload?.comments) ? payload.comments : [];
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const countQuery = useQuery({
    queryKey: countKey,
    queryFn: async () => initialCount,
    initialData: initialCount,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    const cached = queryClient.getQueryData<number>(countKey);
    const serverSnapshotChanged = previousInitialCount.current !== initialCount;

    if (cached === undefined || serverSnapshotChanged) {
      queryClient.setQueryData(countKey, initialCount);
    }

    previousInitialCount.current = initialCount;
  }, [countKey, initialCount, queryClient]);

  const createComment = useMutation({
    mutationFn: async (body: string) => {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });

      const payload = (await response.json().catch(() => null)) as
        | ({ error?: string } & Partial<CreateCommentResponse>)
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "We couldn't post your comment right now.");
      }

      return {
        comment: payload?.comment as ReviewComment,
        reviewId: payload?.reviewId ?? reviewId,
        commentsCount: payload?.commentsCount ?? initialCount,
      } satisfies CreateCommentResponse;
    },
    onMutate: async (body) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: commentsKey }),
        queryClient.cancelQueries({ queryKey: countKey }),
      ]);

      const previousComments =
        queryClient.getQueryData<ReviewComment[]>(commentsKey) ?? [];
      const previousCount =
        queryClient.getQueryData<number>(countKey) ?? initialCount;
      const tempId = `optimistic-${Date.now()}`;
      const optimisticComment: ReviewComment = {
        id: tempId,
        review_id: reviewId,
        author_id: "me",
        parent_id: null,
        body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: {
          username: "you",
          display_name: "You",
          avatar_url: null,
        },
        is_owner: true,
        optimistic: true,
      };

      queryClient.setQueryData<ReviewComment[]>(commentsKey, [
        ...previousComments,
        optimisticComment,
      ]);
      queryClient.setQueryData<number>(countKey, previousCount + 1);

      return { previousComments, previousCount, tempId };
    },
    onError: (_error, _body, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsKey, context.previousComments);
      }

      if (typeof context?.previousCount === "number") {
        queryClient.setQueryData(countKey, context.previousCount);
      }
    },
    onSuccess: async (result, _body, context) => {
      queryClient.setQueryData<ReviewComment[]>(commentsKey, (current = []) => {
        const hasOptimistic = current.some((item) => item.id === context?.tempId);

        if (hasOptimistic) {
          return current.map((item) =>
            item.id === context?.tempId ? result.comment : item,
          );
        }

        const alreadyPresent = current.some((item) => item.id === result.comment.id);
        return alreadyPresent ? current : [...current, result.comment];
      });
      syncCommentsCount(result.commentsCount);
      await queryClient.invalidateQueries({
        queryKey: commentsKey,
        exact: true,
        refetchType: "active",
      });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/reviews/${reviewId}/comments/${commentId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | ({ error?: string } & Partial<DeleteCommentResponse>)
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "We couldn't delete your comment right now.");
      }

      return {
        commentId: payload?.commentId ?? commentId,
        reviewId: payload?.reviewId ?? reviewId,
        commentsCount: payload?.commentsCount ?? 0,
      } satisfies DeleteCommentResponse;
    },
    onMutate: async (commentId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: commentsKey }),
        queryClient.cancelQueries({ queryKey: countKey }),
      ]);

      const previousComments =
        queryClient.getQueryData<ReviewComment[]>(commentsKey) ?? [];
      const previousCount =
        queryClient.getQueryData<number>(countKey) ?? initialCount;

      queryClient.setQueryData<ReviewComment[]>(
        commentsKey,
        previousComments.filter((comment) => comment.id !== commentId),
      );
      queryClient.setQueryData<number>(
        countKey,
        Math.max(previousCount - 1, 0),
      );

      return { previousComments, previousCount, commentId };
    },
    onError: (_error, _commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsKey, context.previousComments);
      }

      if (typeof context?.previousCount === "number") {
        queryClient.setQueryData(countKey, context.previousCount);
      }
    },
    onSuccess: async (result, _commentId, context) => {
      queryClient.setQueryData<ReviewComment[]>(
        commentsKey,
        (current = []) =>
          current.filter((comment) => comment.id !== (context?.commentId ?? result.commentId)),
      );
      syncCommentsCount(result.commentsCount);
      await queryClient.invalidateQueries({
        queryKey: commentsKey,
        exact: true,
        refetchType: "active",
      });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    commentsCount: countQuery.data ?? initialCount,
    isLoading: commentsQuery.isLoading,
    isError: commentsQuery.isError,
    error: commentsQuery.error,
    createComment: createComment.mutateAsync,
    isPosting: createComment.isPending,
    deleteComment: deleteComment.mutateAsync,
    isDeleting: deleteComment.isPending,
  };
}
