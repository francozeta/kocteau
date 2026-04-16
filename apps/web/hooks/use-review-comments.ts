"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  reviewCommentsQueryOptions,
  reviewKeys,
  type ReviewComment,
} from "@/queries/reviews";
import { syncReviewCommentsCount } from "@/queries/viewer";

type UseReviewCommentsOptions = {
  reviewId: string;
  initialCount: number;
  enabled?: boolean;
  viewer?: {
    id?: string | null;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
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
  viewer,
}: UseReviewCommentsOptions) {
  const queryClient = useQueryClient();
  const previousInitialCount = useRef(initialCount);
  const commentsKey = reviewKeys.comments(reviewId);
  const countKey = reviewKeys.commentsCount(reviewId);

  function syncCommentsCount(nextCount: number) {
    syncReviewCommentsCount(queryClient, reviewId, nextCount);
  }

  const commentsQuery = useQuery({
    ...reviewCommentsQueryOptions(reviewId),
    enabled,
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
      syncReviewCommentsCount(queryClient, reviewId, initialCount);
    }

    previousInitialCount.current = initialCount;
  }, [countKey, initialCount, queryClient, reviewId]);

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
      const optimisticAuthor =
        viewer?.username || viewer?.displayName || viewer?.avatarUrl
          ? {
              username: viewer?.username ?? "you",
              display_name: viewer?.displayName ?? null,
              avatar_url: viewer?.avatarUrl ?? null,
            }
          : null;
      const optimisticComment: ReviewComment = {
        id: tempId,
        review_id: reviewId,
        author_id: viewer?.id ?? "me",
        parent_id: null,
        body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: optimisticAuthor,
        is_owner: true,
        optimistic: true,
      };

      queryClient.setQueryData<ReviewComment[]>(commentsKey, [
        ...previousComments,
        optimisticComment,
      ]);
      syncCommentsCount(previousCount + 1);

      return { previousComments, previousCount, tempId };
    },
    onError: (_error, _body, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsKey, context.previousComments);
      }

      if (typeof context?.previousCount === "number") {
        syncCommentsCount(context.previousCount);
      }
    },
    onSuccess: (result, _body, context) => {
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
      syncCommentsCount(Math.max(previousCount - 1, 0));

      return { previousComments, previousCount, commentId };
    },
    onError: (_error, _commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsKey, context.previousComments);
      }

      if (typeof context?.previousCount === "number") {
        syncCommentsCount(context.previousCount);
      }
    },
    onSuccess: (result, _commentId, context) => {
      queryClient.setQueryData<ReviewComment[]>(
        commentsKey,
        (current = []) =>
          current.filter((comment) => comment.id !== (context?.commentId ?? result.commentId)),
      );
      syncCommentsCount(result.commentsCount);
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
