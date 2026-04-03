import "server-only";

import { measureServerTask } from "@/lib/perf";
import { supabaseServer } from "@/lib/supabase/server";

function normalizeProfileIds(profileIds: string[]) {
  return Array.from(new Set(profileIds.filter(Boolean)));
}

export async function getViewerFollowsProfile(
  viewerId: string | null | undefined,
  profileId: string | null | undefined,
) {
  if (!viewerId || !profileId) {
    return false;
  }

  return measureServerTask(
    "getViewerFollowsProfile",
    async () => {
      const supabase = await supabaseServer();
      const { data, error } = await supabase
        .from("profile_follows")
        .select("following_id")
        .eq("follower_id", viewerId)
        .eq("following_id", profileId)
        .limit(1)
        .maybeSingle<{ following_id: string }>();

      if (error) {
        return false;
      }

      return data?.following_id === profileId;
    },
    {
      viewerId,
      profileId,
    },
  );
}

export async function getViewerFollowingProfileIds(
  viewerId: string | null | undefined,
  profileIds: string[],
) {
  const normalizedProfileIds = normalizeProfileIds(profileIds);

  if (!viewerId || normalizedProfileIds.length === 0) {
    return new Set<string>();
  }

  if (normalizedProfileIds.length === 1) {
    const profileId = normalizedProfileIds[0];
    const isFollowing = await getViewerFollowsProfile(viewerId, profileId);

    return isFollowing ? new Set([profileId]) : new Set<string>();
  }

  return measureServerTask(
    "getViewerFollowingProfileIds",
    async () => {
      const supabase = await supabaseServer();
      const { data, error } = await supabase
        .from("profile_follows")
        .select("following_id")
        .eq("follower_id", viewerId)
        .in("following_id", normalizedProfileIds);

      if (error) {
        return new Set<string>();
      }

      return new Set(
        (data ?? [])
          .map((row) => row.following_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      );
    },
    {
      viewerId,
      profileCount: normalizedProfileIds.length,
    },
  );
}
