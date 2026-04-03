import "server-only";

import { measureServerTask } from "@/lib/perf";
import { supabaseServer } from "@/lib/supabase/server";

function normalizeProfileIds(profileIds: string[]) {
  return Array.from(new Set(profileIds.filter(Boolean)));
}

export async function getViewerFollowingProfileIds(
  viewerId: string | null | undefined,
  profileIds: string[],
) {
  const normalizedProfileIds = normalizeProfileIds(profileIds);

  if (!viewerId || normalizedProfileIds.length === 0) {
    return new Set<string>();
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
