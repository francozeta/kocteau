"use client";

import { useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const deferredQuery = useDeferredValue(query.trim());

  return useQuery({
    ...deezerTrackSearchQueryOptions(deferredQuery, type),
    enabled: enabled && type === "track" && deferredQuery.length >= 2,
  });
}
