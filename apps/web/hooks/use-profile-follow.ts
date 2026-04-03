"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  profileKeys,
  syncProfileFollowState,
  type ProfileFollowState,
} from "@/queries/profiles";

type UseProfileFollowOptions = {
  profileId: string;
  initialState: ProfileFollowState;
};

export function useProfileFollow({
  profileId,
  initialState,
}: UseProfileFollowOptions) {
  const queryClient = useQueryClient();
  const previousInitialState = useRef(initialState);
  const queryKey = profileKeys.viewerFollow(profileId);

  const { data: state } = useQuery({
    queryKey,
    queryFn: async () => initialState,
    initialData: initialState,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    const cached = queryClient.getQueryData<ProfileFollowState>(queryKey);
    const serverSnapshotChanged =
      previousInitialState.current.following !== initialState.following;

    if (!cached || serverSnapshotChanged) {
      syncProfileFollowState(queryClient, profileId, initialState);
    }

    previousInitialState.current = initialState;
  }, [initialState, profileId, queryClient, queryKey]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/profiles/${profileId}/follow`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; following?: boolean }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ?? "We couldn't update this follow right now.",
        );
      }

      return {
        following: payload?.following ?? false,
      } satisfies ProfileFollowState;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<ProfileFollowState>(queryKey) ?? initialState;
      const next = {
        following: !previous.following,
      } satisfies ProfileFollowState;

      syncProfileFollowState(queryClient, profileId, next);

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        syncProfileFollowState(queryClient, profileId, context.previous);
      }
    },
    onSuccess: (nextState) => {
      syncProfileFollowState(queryClient, profileId, nextState);
    },
  });

  return {
    state,
    toggleFollow: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
