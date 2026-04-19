import "server-only";

import { measureServerTask } from "@/lib/perf";
import { supabaseServer } from "@/lib/supabase/server";
import type { StarterTrack } from "@/lib/starter";

export async function getStarterTracks({
  viewerId,
  limit = 6,
}: {
  viewerId: string | null | undefined;
  limit?: number;
}): Promise<StarterTrack[]> {
  if (!viewerId) {
    return [];
  }

  return measureServerTask(
    "getStarterTracks",
    async () => {
      const supabase = await supabaseServer();
      const { data, error } = await supabase.rpc("get_starter_tracks", {
        p_limit: Math.max(1, Math.min(limit, 12)),
      });

      if (error) {
        console.error("[starter.getStarterTracks] failed", {
          code: error.code ?? null,
          message: error.message ?? null,
        });

        return [];
      }

      return (data ?? []) as StarterTrack[];
    },
    {
      viewerId,
      limit,
    },
  );
}
