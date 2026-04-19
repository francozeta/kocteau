import { queryOptions } from "@tanstack/react-query";
import type { Tables } from "@/lib/supabase/database.types";
import { fetchJson } from "@/queries/http";

export type StarterTrackRow = Tables<"starter_tracks">;

export const starterKeys = {
  all: ["starter"] as const,
  curatorTracks: () => ["starter", "curator-tracks"] as const,
};

export function starterCuratorTracksQueryOptions() {
  return queryOptions({
    queryKey: starterKeys.curatorTracks(),
    queryFn: () => fetchJson<StarterTrackRow[]>("/api/starter/tracks"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
