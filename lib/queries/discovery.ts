import "server-only";

import { supabaseServer } from "@/lib/supabase/server";

type DiscoveryRow = {
  created_at: string;
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
};

function getEntity(row: DiscoveryRow) {
  if (Array.isArray(row.entities)) {
    return row.entities[0] ?? null;
  }

  return row.entities;
}

export async function getRecentlyDiscussedTracks(limit = 12): Promise<DiscoveryTrack[]> {
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("reviews")
    .select(`
      created_at,
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

  for (const row of (data ?? []) as DiscoveryRow[]) {
    const entity = getEntity(row);

    if (!entity || seen.has(entity.id)) {
      continue;
    }

    seen.add(entity.id);
    tracks.push({
      entityId: entity.id,
      title: entity.title,
      artistName: entity.artist_name,
      coverUrl: entity.cover_url,
      latestReviewAt: row.created_at,
    });

    if (tracks.length >= limit) {
      break;
    }
  }

  return tracks;
}
