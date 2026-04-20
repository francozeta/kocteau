import { queryOptions } from "@tanstack/react-query";
import type { Tables } from "@/lib/supabase/database.types";
import { fetchJson } from "@/queries/http";

export type StarterTrackRow = Tables<"starter_tracks">;
export type StarterPreferenceTag = Tables<"preference_tags">;
export type StarterTrackTag = {
  tag_id: string;
  weight: number;
  preference_tags: StarterPreferenceTag | null;
};

export type StarterTrackWithTags = StarterTrackRow & {
  starter_track_tags?: StarterTrackTag[] | null;
};

export type StarterStudioData = {
  tracks: StarterTrackWithTags[];
  tags: StarterPreferenceTag[];
};

export const starterKeys = {
  all: ["starter"] as const,
  curatorTracks: () => ["starter", "curator-tracks"] as const,
};

export function starterCuratorTracksQueryOptions() {
  return queryOptions({
    queryKey: starterKeys.curatorTracks(),
    queryFn: () => fetchJson<StarterStudioData>("/api/starter/tracks"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
