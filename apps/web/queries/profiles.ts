import type { QueryClient } from "@tanstack/react-query";

export type ProfileFollowState = {
  following: boolean;
};

export const profileKeys = {
  all: ["profiles"] as const,
  viewerFollow: (profileId: string) =>
    ["profiles", "viewer", profileId, "follow"] as const,
};

export function syncProfileFollowState(
  queryClient: QueryClient,
  profileId: string,
  nextState: ProfileFollowState,
) {
  queryClient.setQueryData(profileKeys.viewerFollow(profileId), nextState);
}
