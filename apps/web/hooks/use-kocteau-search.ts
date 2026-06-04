"use client";

import { useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchEntityType } from "@/lib/search-types";
import { kocteauTrackSearchQueryOptions } from "@/queries/tracks";

export type { KocteauSearchResult } from "@/queries/tracks";

type UseKocteauSearchOptions = {
  query: string;
  type?: SearchEntityType;
  enabled?: boolean;
};

export function useKocteauSearch({
  query,
  type = "track",
  enabled = true,
}: UseKocteauSearchOptions) {
  const trimmedQuery = query.trim();
  const deferredQuery = useDeferredValue(trimmedQuery);
  const debouncedQuery = useDebouncedValue(deferredQuery, 250);

  return useQuery({
    ...kocteauTrackSearchQueryOptions(debouncedQuery, type),
    enabled: enabled && type === "track" && debouncedQuery.length >= 2,
  });
}
