"use client";

import { useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchScope } from "@/lib/search-types";
import { kocteauTrackSearchQueryOptions } from "@/queries/tracks";

export type { KocteauSearchResult } from "@/queries/tracks";

type UseKocteauSearchOptions = {
  query: string;
  type?: SearchScope;
  enabled?: boolean;
  debounceMs?: number;
};

export function useKocteauSearch({
  query,
  type = "track",
  enabled = true,
  debounceMs = 250,
}: UseKocteauSearchOptions) {
  const trimmedQuery = query.trim();
  const deferredQuery = useDeferredValue(trimmedQuery);
  const debouncedQuery = useDebouncedValue(deferredQuery, debounceMs);

  return useQuery({
    ...kocteauTrackSearchQueryOptions(debouncedQuery, type),
    enabled: enabled && debouncedQuery.length >= 2,
  });
}
