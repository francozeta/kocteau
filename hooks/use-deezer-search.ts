"use client";

import { useDeferredValue } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { SearchEntityType } from "@/lib/search-types";

export type DeezerSearchResult = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
};

type UseDeezerSearchOptions = {
  query: string;
  type?: SearchEntityType;
  enabled?: boolean;
};

export function useDeezerSearch({
  query,
  type = "track",
  enabled = true,
}: UseDeezerSearchOptions) {
  const deferredQuery = useDeferredValue(query.trim());

  return useQuery({
    queryKey: ["deezer-search", type, deferredQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: deferredQuery,
        type,
      });

      const response = await fetch(`/api/deezer/search?${params.toString()}`);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "No pudimos buscar ahora mismo.");
      }

      const payload = (await response.json()) as DeezerSearchResult[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled: enabled && type === "track" && deferredQuery.length >= 2,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: keepPreviousData,
  });
}
