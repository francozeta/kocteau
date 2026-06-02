import "server-only";

import { measureServerTask } from "@/lib/perf";
import type { StarterSurface } from "@/lib/starter/surface";
import { supabaseServer } from "@/lib/supabase/server";
import type { StarterTrack } from "@/lib/starter";

type StarterEntityLookup = {
  id: string;
  provider: string;
  provider_id: string;
  type: string;
};

type ReviewedEntityLookup = {
  entity_id: string;
};

function getStarterTrackKey(track: {
  provider: string;
  provider_id: string;
  type: string;
}) {
  return `${track.provider}:${track.type}:${track.provider_id}`;
}

function isMissingSurfaceRpc(error: { code?: string | null; message?: string | null }) {
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    Boolean(error.message?.includes("get_starter_tracks_for_surface"))
  );
}

export async function getStarterTracks({
  viewerId,
  limit = 6,
}: {
  viewerId: string | null | undefined;
  limit?: number;
}): Promise<StarterTrack[]> {
  return measureServerTask(
    "getStarterTracks",
    async () => {
      const supabase = await supabaseServer();
      const requestedLimit = Math.max(1, Math.min(limit, 12));
      const { data, error } = await supabase.rpc("get_starter_tracks", {
        p_limit: 12,
      });

      if (error) {
        console.error("[starter.getStarterTracks] failed", {
          code: error.code ?? null,
          message: error.message ?? null,
        });

        return [];
      }

      const tracks = (data ?? []) as StarterTrack[];
      const providerIds = Array.from(
        new Set(tracks.map((track) => track.provider_id).filter(Boolean)),
      );

      if (providerIds.length === 0) {
        return tracks.slice(0, requestedLimit);
      }

      if (!viewerId) {
        return tracks.slice(0, requestedLimit);
      }

      const { data: entities, error: entitiesError } = await supabase
        .from("entities")
        .select("id, provider, provider_id, type")
        .in("provider_id", providerIds)
        .returns<StarterEntityLookup[]>();

      if (entitiesError) {
        console.error("[starter.getStarterTracks] entity lookup failed", {
          code: entitiesError.code ?? null,
          message: entitiesError.message ?? null,
        });

        return tracks.slice(0, requestedLimit);
      }

      const entityIds = (entities ?? []).map((entity) => entity.id);

      if (entityIds.length === 0) {
        return tracks.slice(0, requestedLimit);
      }

      const { data: reviewedEntities, error: reviewsError } = await supabase
        .from("reviews")
        .select("entity_id")
        .eq("author_id", viewerId)
        .in("entity_id", entityIds)
        .returns<ReviewedEntityLookup[]>();

      if (reviewsError) {
        console.error("[starter.getStarterTracks] review lookup failed", {
          code: reviewsError.code ?? null,
          message: reviewsError.message ?? null,
        });

        return tracks.slice(0, requestedLimit);
      }

      const reviewedEntityIds = new Set(
        (reviewedEntities ?? []).map((review) => review.entity_id),
      );
      const reviewedStarterKeys = new Set(
        (entities ?? [])
          .filter((entity) => reviewedEntityIds.has(entity.id))
          .map(getStarterTrackKey),
      );

      return tracks
        .filter((track) => !reviewedStarterKeys.has(getStarterTrackKey(track)))
        .slice(0, requestedLimit);
    },
    {
      viewerId,
      limit,
    },
  );
}

export async function getStarterTracksForSurface({
  viewerId,
  limit = 6,
  surface = "home",
  contextKey,
  excludeProviderIds = [],
}: {
  viewerId: string | null | undefined;
  limit?: number;
  surface?: StarterSurface;
  contextKey?: string | null;
  excludeProviderIds?: string[];
}): Promise<StarterTrack[]> {
  return measureServerTask(
    "getStarterTracksForSurface",
    async () => {
      if (!viewerId) {
        return [];
      }

      const supabase = await supabaseServer();
      const requestedLimit = Math.max(1, Math.min(limit, 12));
      const { data, error } = await supabase.rpc("get_starter_tracks_for_surface", {
        p_limit: requestedLimit,
        p_surface: surface,
        p_context_key: contextKey ?? surface,
        p_exclude_provider_ids: excludeProviderIds,
      });

      if (error) {
        console.error("[starter.getStarterTracksForSurface] failed", {
          code: error.code ?? null,
          message: error.message ?? null,
          surface,
          contextKey,
        });

        if (isMissingSurfaceRpc(error)) {
          return getStarterTracks({ viewerId, limit: requestedLimit });
        }

        return [];
      }

      return ((data ?? []) as StarterTrack[]).slice(0, requestedLimit);
    },
    {
      viewerId,
      limit,
      surface,
      contextKey,
    },
  );
}
