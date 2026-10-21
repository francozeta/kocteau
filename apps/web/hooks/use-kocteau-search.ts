"use client";

import { useDeferredValue, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { rankCatalogSearchResults } from "@/lib/search/kocteau-first";
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

  const searchEnabled = enabled && debouncedQuery.length >= 2;
  const local = useQuery({
    ...kocteauTrackSearchQueryOptions(debouncedQuery, type, "local"),
    enabled: searchEnabled,
  });
  const remote = useQuery({
    ...kocteauTrackSearchQueryOptions(debouncedQuery, type, "remote"),
    enabled: searchEnabled,
  });
  const isCurrentQuery = trimmedQuery === debouncedQuery;
  const data = useMemo(
    () => isCurrentQuery && searchEnabled
      ? rankCatalogSearchResults({
          query: debouncedQuery,
          type,
          candidates: [...(local.data ?? []), ...(remote.data ?? [])].map(
            (result) => ({ ...result, source: result.source ?? "deezer" }),
          ),
        })
      : [],
    [isCurrentQuery, searchEnabled, debouncedQuery, type, local.data, remote.data],
  );
  const error = data.length === 0 ? local.error ?? remote.error : null;

  return {
    data,
    // Results remain selectable while the other source is still loading.
    isFetching: enabled && trimmedQuery.length >= 2 && (!isCurrentQuery || local.isFetching || remote.isFetching),
    isPlaceholderData: false,
    error,
    isError: Boolean(error),
    refetch: () => Promise.all([local.refetch(), remote.refetch()]),
  };
}
