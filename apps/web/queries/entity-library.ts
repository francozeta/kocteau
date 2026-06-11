import type { QueryClient } from "@tanstack/react-query";
import {
  type EntityLibraryItemType,
  type EntityLibraryState,
  getNextEntityLibraryState,
} from "@/lib/library/entity-library";
import { fetchJson } from "@/queries/http";

export type EntityLibraryMutationEntity = {
  id?: string | null;
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
};

export type EntityLibraryMutationInput = {
  entity: EntityLibraryMutationEntity;
  itemType: EntityLibraryItemType;
  active: boolean;
  source?: string;
};

export type EntityLibraryMutationResult = {
  ok: boolean;
  entityId: string;
  itemType: EntityLibraryItemType;
  active: boolean;
  savedAt: string | null;
};

export const entityLibraryKeys = {
  all: ["entity-library"] as const,
  state: (entityId: string) => ["entity-library", "state", entityId] as const,
};

export function setEntityLibraryState(
  queryClient: QueryClient,
  entityId: string | null | undefined,
  itemType: EntityLibraryItemType,
  active: boolean,
) {
  if (!entityId) {
    return;
  }

  queryClient.setQueryData<EntityLibraryState | undefined>(
    entityLibraryKeys.state(entityId),
    (current) =>
      getNextEntityLibraryState(
        current ?? { library: false },
        itemType,
        active,
      ),
  );
}

export async function mutateEntityLibraryItem(input: EntityLibraryMutationInput) {
  return fetchJson<EntityLibraryMutationResult>("/api/entities/library", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}
