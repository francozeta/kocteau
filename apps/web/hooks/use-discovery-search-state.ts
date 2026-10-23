"use client";

import { useEffect, useState } from "react";
import { discoveryMemoryKey } from "@/lib/discovery/memory";
import {
  readDiscoverySearchState,
  type DiscoverySearchState,
} from "@/lib/discovery/search-state";

export function useDiscoverySearchState(
  initialQuery: string,
  viewerId: string | null,
) {
  const account = discoveryMemoryKey(viewerId);
  const storageKey = `${account}:search`;
  const [search, setSearch] = useState<DiscoverySearchState>({
    query: initialQuery.slice(0, 80),
    scope: "all",
  });
  const [restoredAccount, setRestoredAccount] = useState<string | null>(null);
  const ready = restoredAccount === account;

  useEffect(() => {
    const restore = () => {
      const path = window.location.pathname + window.location.search;
      let restored = readDiscoverySearchState(
        window.history.state?.discoverySearch,
        Date.now(),
        account,
        path,
      );
      if (!restored) {
        try {
          const raw = sessionStorage.getItem(storageKey);
          restored =
            raw && raw.length <= 4096
              ? readDiscoverySearchState(
                  JSON.parse(raw),
                  Date.now(),
                  account,
                  path,
                )
              : null;
        } catch {
          // History and in-memory state remain available without storage.
        }
      }
      setSearch(
        restored ?? {
          query:
            new URLSearchParams(window.location.search)
              .get("q")
              ?.slice(0, 80) ?? "",
          scope: "all",
        },
      );
      setRestoredAccount(account);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [account, storageKey]);

  useEffect(() => {
    if (!ready) return;
    const snapshot = {
      account,
      path: window.location.pathname + window.location.search,
      savedAt: Date.now(),
      search,
    };
    window.history.replaceState(
      {
        ...window.history.state,
        discoverySearch: snapshot,
      },
      "",
    );
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
      // Search still works when browser storage is unavailable.
    }
  }, [account, ready, search, storageKey]);

  return {
    query: search.query,
    scope: search.scope,
    ready,
    setQuery: (query: string) =>
      setSearch((current) => ({
        ...current,
        query: query.slice(0, 80),
      })),
    setScope: (scope: DiscoverySearchState["scope"]) =>
      setSearch((current) => ({
        ...current,
        scope,
      })),
  };
}
