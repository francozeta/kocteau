import "server-only";

import {
  type EntityLibraryItemType,
  type EntityLibraryState,
  getEmptyEntityLibraryState,
} from "@/lib/library/entity-library";
import { measureServerTask } from "@/lib/perf";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";
import { supabaseServer } from "@/lib/supabase/server";

export type ViewerEntityLibraryItem = {
  item_type: EntityLibraryItemType;
  saved_at: string;
  entity: {
    id: string;
    provider: string;
    provider_id: string;
    type: "track" | "album";
    title: string;
    artist_name: string | null;
    cover_url: string | null;
    deezer_url: string | null;
    href: string;
    artist: ViewerLibraryArtist | null;
  } | null;
};

export type ViewerLibraryArtist = {
  id: string;
  provider: string;
  provider_id: string;
  name: string;
  image_url: string | null;
  deezer_url: string | null;
  href: string;
};

export type ViewerLibraryArtistItem = {
  saved_at: string;
  artist: ViewerLibraryArtist;
};

type EntityLibraryRow = {
  item_type: EntityLibraryItemType;
  created_at: string;
  entities: {
    id: string;
    provider: string;
    provider_id: string;
    type: "track" | "album";
    title: string;
    artist_name: string | null;
    cover_url: string | null;
    deezer_url: string | null;
    artist: {
      id: string;
      provider: string;
      provider_id: string;
      name: string;
      image_url: string | null;
      deezer_url: string | null;
    } | null;
  } | null;
};

type EntityLibraryStateRow = {
  entity_id: string;
  library: boolean | null;
};

function normalizeLibraryItem(row: EntityLibraryRow): ViewerEntityLibraryItem {
  return {
    item_type: row.item_type,
    saved_at: row.created_at,
    entity: row.entities
      ? {
          ...row.entities,
          href: buildEntityCanonicalPath(row.entities),
          artist: row.entities.artist
            ? {
                ...row.entities.artist,
                href: buildEntityCanonicalPath({
                  id: row.entities.artist.id,
                  provider: row.entities.artist.provider,
                  provider_id: row.entities.artist.provider_id,
                  type: "artist",
                  title: row.entities.artist.name,
                }),
              }
            : null,
        }
      : null,
  };
}

export async function getViewerEntityLibraryState(
  userId: string | null | undefined,
  entityIds: string[],
) {
  const empty = new Map<string, EntityLibraryState>();

  if (!userId || entityIds.length === 0) {
    return empty;
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("get_viewer_entity_library_state", {
    p_entity_ids: Array.from(new Set(entityIds)),
  });

  if (error) {
    console.warn("[entity-library.getViewerEntityLibraryState] skipped", {
      code: error.code ?? null,
      message: error.message ?? null,
      entityCount: entityIds.length,
    });

    return empty;
  }

  return new Map(
    ((data ?? []) as EntityLibraryStateRow[]).map((row) => [
      row.entity_id,
      {
        library: Boolean(row.library),
      },
    ]),
  );
}

export async function getViewerEntityLibraryItems(userId: string) {
  return measureServerTask(
    "getViewerEntityLibraryItems",
    async () => {
      const supabase = await supabaseServer();
      const { data, error } = await supabase
        .from("entity_library_items")
        .select(
          `
            item_type,
            created_at,
            entities!inner (
              id,
              provider,
              provider_id,
              type,
              title,
              artist_name,
              cover_url,
              deezer_url,
              artist:artists (
                id,
                provider,
                provider_id,
                name,
                image_url,
                deezer_url
              )
            )
          `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .returns<EntityLibraryRow[]>();

      if (error) {
        console.warn("[entity-library.getViewerEntityLibraryItems] skipped", {
          code: error.code ?? null,
          message: error.message ?? null,
          userId,
        });

        return {
          tracks: [] satisfies ViewerEntityLibraryItem[],
          albums: [] satisfies ViewerEntityLibraryItem[],
          artists: [] satisfies ViewerLibraryArtistItem[],
        };
      }

      const items = (data ?? []).map(normalizeLibraryItem);

      const libraryItems = items.filter((item) => item.item_type === "library");
      const artistsById = new Map<string, ViewerLibraryArtistItem>();

      libraryItems.forEach((item) => {
        const artist = item.entity?.artist;

        if (artist && !artistsById.has(artist.id)) {
          artistsById.set(artist.id, {
            saved_at: item.saved_at,
            artist,
          });
        }
      });

      return {
        tracks: libraryItems.filter((item) => item.entity?.type === "track"),
        albums: libraryItems.filter((item) => item.entity?.type === "album"),
        artists: [...artistsById.values()],
      };
    },
    { userId },
  );
}

export function getEntityLibraryStateOrEmpty(
  states: Map<string, EntityLibraryState>,
  entityId: string | null | undefined,
) {
  return entityId ? states.get(entityId) ?? getEmptyEntityLibraryState() : getEmptyEntityLibraryState();
}
