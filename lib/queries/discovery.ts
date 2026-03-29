import "server-only";

import { unstable_cache } from "next/cache";
import { measureServerTask } from "@/lib/perf";
import { supabasePublic } from "@/lib/supabase/public";

type DiscoveryRow = {
  created_at: string;
  entity_id: string;
  rating: number;
  entities:
    | {
        id: string;
        title: string;
        artist_name: string | null;
        cover_url: string | null;
      }
    | {
        id: string;
        title: string;
        artist_name: string | null;
        cover_url: string | null;
      }[]
    | null;
};

export type DiscoveryTrack = {
  entityId: string;
  title: string;
  artistName: string | null;
  coverUrl: string | null;
  latestReviewAt: string;
  reviewCount: number;
  averageRating: number | null;
};

function getEntity(row: DiscoveryRow) {
  if (Array.isArray(row.entities)) {
    return row.entities[0] ?? null;
  }

  return row.entities;
}

export async function getRecentlyDiscussedTracks(limit = 12): Promise<DiscoveryTrack[]> {
  return unstable_cache(
    async () =>
      measureServerTask(
        "getRecentlyDiscussedTracks",
        async () => {
      const supabase = supabasePublic();

      const { data } = await supabase
        .from("reviews")
        .select(`
          created_at,
          entity_id,
          rating,
          entities!inner (
            id,
            title,
            artist_name,
            cover_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(Math.max(limit * 4, 24));

      const seen = new Set<string>();
      const tracks: DiscoveryTrack[] = [];
      const recentEntityIds: string[] = [];

      for (const row of (data ?? []) as DiscoveryRow[]) {
        const entity = getEntity(row);

        if (!entity || seen.has(entity.id)) {
          continue;
        }

        seen.add(entity.id);
        recentEntityIds.push(entity.id);
        tracks.push({
          entityId: entity.id,
          title: entity.title,
          artistName: entity.artist_name,
          coverUrl: entity.cover_url,
          latestReviewAt: row.created_at,
          reviewCount: 0,
          averageRating: null,
        });

        if (tracks.length >= limit) {
          break;
        }
      }

      if (recentEntityIds.length === 0) {
        return tracks;
      }

      const { data: ratings } = await supabase
        .from("reviews")
        .select("entity_id, rating")
        .in("entity_id", recentEntityIds);

      const ratingMap = new Map<string, { total: number; count: number }>();

      for (const row of ratings ?? []) {
        const current = ratingMap.get(row.entity_id) ?? { total: 0, count: 0 };
        current.total += row.rating;
        current.count += 1;
        ratingMap.set(row.entity_id, current);
      }

      return tracks.map((track) => {
        const aggregate = ratingMap.get(track.entityId);

        if (!aggregate || aggregate.count === 0) {
          return track;
        }

        return {
          ...track,
          reviewCount: aggregate.count,
          averageRating: Number((aggregate.total / aggregate.count).toFixed(1)),
        };
      });

        },
        { limit },
      ),
    ["discovery-recent-tracks", String(limit)],
    {
      revalidate: 60,
      tags: ["reviews", "entities", `discovery:${limit}`],
    },
  )();
}
