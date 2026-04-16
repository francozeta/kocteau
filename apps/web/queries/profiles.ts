import type { QueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type { ActiveProfile } from "@/lib/queries/profiles";
import { fetchJson } from "@/queries/http";

export type ProfileFollowState = {
  following: boolean;
};

export type ActiveProfilesQueryData = {
  profiles: Array<ActiveProfile & {
    viewer_is_following: boolean;
  }>;
};

export const profileKeys = {
  all: ["profiles"] as const,
  active: (limit = 4) => ["profiles", "active", limit] as const,
  viewerFollow: (profileId: string) =>
    ["profiles", "viewer", profileId, "follow"] as const,
};

export function activeProfilesQueryOptions(limit = 4) {
  return queryOptions({
    queryKey: profileKeys.active(limit),
    queryFn: () =>
      fetchJson<ActiveProfilesQueryData>(`/api/profiles/active?limit=${limit}`),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function syncProfileFollowState(
  queryClient: QueryClient,
  profileId: string,
  nextState: ProfileFollowState,
) {
  queryClient.setQueryData(profileKeys.viewerFollow(profileId), nextState);
}
