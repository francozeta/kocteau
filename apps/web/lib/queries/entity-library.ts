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
  } | null;
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
  } | null;
};

type EntityLibraryStateRow = {
  entity_id: string;
  listen_later: boolean | null;
  review_later: boolean | null;
};

function normalizeLibraryItem(row: EntityLibraryRow): ViewerEntityLibraryItem {
  return {
    item_type: row.item_type,
    saved_at: row.created_at,
    entity: row.entities
      ? {
          ...row.entities,
          href: buildEntityCanonicalPath(row.entities),
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
        listen_later: Boolean(row.listen_later),
        review_later: Boolean(row.review_later),
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
              deezer_url
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
          listenLater: [] satisfies ViewerEntityLibraryItem[],
          reviewLater: [] satisfies ViewerEntityLibraryItem[],
        };
      }

      const items = (data ?? []).map(normalizeLibraryItem);

      return {
        listenLater: items.filter((item) => item.item_type === "listen_later"),
        reviewLater: items.filter((item) => item.item_type === "review_later"),
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
