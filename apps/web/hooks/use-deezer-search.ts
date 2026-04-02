"use client";

import { useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchEntityType } from "@/lib/search-types";
import { deezerTrackSearchQueryOptions } from "@/queries/tracks";

export type { DeezerSearchResult } from "@/queries/tracks";

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
  const trimmedQuery = query.trim();
  const deferredQuery = useDeferredValue(trimmedQuery);
  const debouncedQuery = useDebouncedValue(deferredQuery, 250);

  return useQuery({
    ...deezerTrackSearchQueryOptions(debouncedQuery, type),
    enabled: enabled && type === "track" && debouncedQuery.length >= 2,
  });
}
