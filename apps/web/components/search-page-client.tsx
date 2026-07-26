"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle, Search } from "@/components/ui/icons";
import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import TrackContextMenu from "@/components/track-context-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useKocteauSearch, type KocteauSearchResult } from "@/hooks/use-kocteau-search";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SearchEntityType } from "@/lib/search-types";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";
import { cn } from "@/lib/utils";

type SearchPageClientProps = {
  initialQuery: string;
  initialType: SearchEntityType;
  discoverContent: ReactNode;
};

type RecentSearch = {
  label: string;
  query: string;
};

type ActiveSearchResultState = {
  key: string;
  index: number;
};

const recentSearchesStorageKey = "kocteau:recent-searches";
const recentSearchesChangedEvent = "kocteau:recent-searches-changed";
const emptyRecentSearchesSnapshot = "[]";

function parseRecentSearchesSnapshot(snapshot: string): RecentSearch[] {
  try {
    const parsed = JSON.parse(snapshot) as RecentSearch[];

    if (Array.isArray(parsed)) {
      return parsed.slice(0, 6);
    }
  } catch {
    // Ignore broken local storage payloads and fall back to empty recent searches.
  }

  return [];
}

function getRecentSearchesSnapshot() {
  return window.localStorage.getItem(recentSearchesStorageKey) ?? emptyRecentSearchesSnapshot;
}

function getRecentSearchesServerSnapshot() {
  return emptyRecentSearchesSnapshot;
}

function subscribeRecentSearches(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === recentSearchesStorageKey) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(recentSearchesChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(recentSearchesChangedEvent, onStoreChange);
  };
}

function notifyRecentSearchesChanged() {
  window.dispatchEvent(new Event(recentSearchesChangedEvent));
}

function getResultHref(result: KocteauSearchResult) {
  return result.entity_id
    ? buildEntityCanonicalPath({
        id: result.entity_id,
        provider: result.provider,
        provider_id: result.provider_id,
        type: result.type,
        title: result.title,
        artist_name: result.artist_name,
      })
    : `/track/deezer/${result.provider_id}`;
}

function SearchSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-muted-foreground/72">
      {children}
    </p>
  );
}

export default function SearchPageClient({
  initialQuery,
  initialType,
  discoverContent,
}: SearchPageClientProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(initialQuery);
  const [activeIndexState, setActiveIndexState] = useState<ActiveSearchResultState>({
    key: "",
    index: -1,
  });
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const searchType = initialType;
  const normalizedQuery = query.trim();
  const recentSearchesSnapshot = useSyncExternalStore(
    subscribeRecentSearches,
    getRecentSearchesSnapshot,
    getRecentSearchesServerSnapshot,
  );
  const recentSearches = useMemo(
    () => parseRecentSearchesSnapshot(recentSearchesSnapshot),
    [recentSearchesSnapshot],
  );
  const { data = [], isFetching, error, refetch: retrySearch } = useKocteauSearch({
    query,
    type: searchType,
    enabled: true,
  });
  const results = data as KocteauSearchResult[];
  const activeResultKey = useMemo(
    () =>
      [
        normalizedQuery,
        ...results.map((result) => `${result.provider}:${result.provider_id}`),
      ].join("|"),
    [normalizedQuery, results],
  );
  const defaultActiveIndex = -1;
  const activeIndex =
    activeIndexState.key === activeResultKey ? activeIndexState.index : defaultActiveIndex;

  function setActiveIndex(nextIndex: number | ((current: number) => number)) {
    setActiveIndexState((current) => {
      const currentIndex =
        current.key === activeResultKey ? current.index : defaultActiveIndex;

      return {
        key: activeResultKey,
        index:
          typeof nextIndex === "function" ? nextIndex(currentIndex) : nextIndex,
      };
    });
  }

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    resultRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window === "undefined") {
        return;
      }

      const next = new URLSearchParams(window.location.search);

      if (normalizedQuery) {
        next.set("q", normalizedQuery);
      } else {
        next.delete("q");
      }

      if (searchType !== "track") {
        next.set("type", searchType);
      } else {
        next.delete("type");
      }

      const updated = next.toString();
      const current = window.location.search.startsWith("?")
        ? window.location.search.slice(1)
        : window.location.search;

      if (current !== updated) {
        const nextUrl = updated ? `${pathname}?${updated}` : pathname;
        window.history.replaceState(window.history.state, "", nextUrl);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [normalizedQuery, pathname, searchType]);

  const hasQuery = normalizedQuery.length > 0;
  const resultKind =
    searchType === "artist" ? "artist" : searchType === "album" ? "album" : "track";
  const resultCountLabel = `${results.length} ${resultKind}${results.length === 1 ? "" : "s"}`;
  const resultSectionTitle = `${resultKind[0]?.toUpperCase()}${resultKind.slice(1)}s`;

  const showSkeletonResults =
    hasQuery && normalizedQuery.length >= 2 && isFetching && results.length === 0;
  const showSearchError = normalizedQuery.length >= 2 && Boolean(error);
  const searchErrorMessage =
    error instanceof Error && error.message
      ? error.message
      : "Music search is taking longer than usual. Try again in a moment.";

  function persistRecentSearch(nextQuery: string) {
    const label = nextQuery.trim();

    if (label.length < 2 || typeof window === "undefined") {
      return;
    }

    const nextItem = {
      label,
      query: label,
    } satisfies RecentSearch;

    const next = [
      nextItem,
      ...recentSearches.filter((item) => item.query.toLowerCase() !== label.toLowerCase()),
    ].slice(0, 6);

    window.localStorage.setItem(recentSearchesStorageKey, JSON.stringify(next));
    notifyRecentSearchesChanged();
  }

  function clearRecentSearches() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(recentSearchesStorageKey);
      notifyRecentSearchesChanged();
    }
  }

  function handleSearchSuggestionSelect(nextQuery: string) {
    setQuery(nextQuery);
    persistRecentSearch(nextQuery);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (normalizedQuery.length < 2 || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const activeResult = results[activeIndex];
      persistRecentSearch(activeResult.title);
      router.push(getResultHref(activeResult));
    }
  }

  return (
    <div className="w-full max-w-5xl lg:max-w-none">
      <div className="min-w-0 space-y-6">
        <div className="relative min-w-0">
          <label htmlFor="discover-search" className="sr-only">
            Search music
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/68" />
          <Input
            id="discover-search"
            data-global-search-input="true"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search tracks or artists…"
            className="mobile-liquid-panel h-11 rounded-[var(--kocteau-radius-control)] border-transparent bg-[var(--kocteau-surface-control)] pl-10 text-base shadow-[var(--kocteau-shadow-control)] placeholder:text-muted-foreground/58 sm:text-[13px]"
            autoFocus={!isMobile}
            maxLength={80}
          />
        </div>

        {showSearchError ? (
          <div className="flex flex-col gap-3 rounded-[var(--kocteau-radius-card)] bg-[var(--kocteau-surface)] px-4 py-3 shadow-[var(--kocteau-shadow-card)] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">
                Search is taking longer than usual
              </p>
              <p className="mt-0.5 text-pretty text-[12px] leading-5 text-muted-foreground/72">
                {searchErrorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void retrySearch();
              }}
              disabled={isFetching}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-[0.65rem] bg-[var(--kocteau-surface-control)] px-3 text-[12px] font-medium text-foreground/84 shadow-[var(--kocteau-shadow-control)] transition-[background-color,transform] duration-150 hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-55"
            >
              {isFetching ? "Retrying" : "Try again"}
            </button>
          </div>
        ) : null}

        {!hasQuery && recentSearches.length > 0 ? (
          <section
            aria-label="Recent searches"
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1"
          >
            <SearchSectionLabel>Recent</SearchSectionLabel>
            {recentSearches.slice(0, 4).map((item) => (
              <button
                key={item.query}
                type="button"
                onClick={() => handleSearchSuggestionSelect(item.query)}
                className="inline-flex min-h-8 items-center rounded-[0.55rem] px-1 text-[13px] text-foreground/72 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={clearRecentSearches}
              aria-label="Clear recent searches"
              className="inline-flex min-h-8 items-center rounded-[0.55rem] px-1 text-[12px] text-muted-foreground/46 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              Clear
            </button>
          </section>
        ) : null}

        {!hasQuery ? discoverContent : null}

        {hasQuery ? (
          <section className="max-w-3xl space-y-3" aria-live="polite">
            {showSkeletonResults ? (
              <div className="grid gap-1" aria-label="Searching tracks">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-[0.75rem] p-2">
                    <Skeleton className="size-14 rounded-[0.62rem] bg-foreground/[0.065]" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/5 bg-foreground/[0.07]" />
                      <Skeleton className="h-3 w-1/3 bg-foreground/[0.05]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!showSkeletonResults && normalizedQuery.length > 0 && normalizedQuery.length < 2 ? (
              <p className="px-1 py-4 text-[13px] text-muted-foreground/64">
                Type one more character to search.
              </p>
            ) : null}

            {!showSkeletonResults && !showSearchError && normalizedQuery.length >= 2 && results.length === 0 ? (
              <div className="px-1 py-10">
                <p className="font-pixel text-[1.05rem] font-medium text-foreground">
                  No matches for “{normalizedQuery}”
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground/66">
                  Try another track or artist.
                </p>
              </div>
            ) : null}

            {results.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 px-2">
                  <h2 className="font-pixel text-[1.05rem] font-medium text-foreground">
                    {resultSectionTitle}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground/52">
                    {isFetching ? <LoaderCircle className="size-3 animate-spin" /> : null}
                    {resultCountLabel}
                  </span>
                </div>

                <div className="grid gap-1">
                  {results.map((result, index) => {
                    const resultLink = (
                      <PrefetchLink
                        key={`${result.provider}-${result.type}-${result.provider_id}`}
                        href={getResultHref(result)}
                        queryWarmup={
                          result.type === "track" && result.entity_id
                            ? { kind: "track", id: result.entity_id }
                            : undefined
                        }
                        onClick={() => persistRecentSearch(result.title)}
                        ref={(node) => {
                          resultRefs.current[index] = node;
                        }}
                        className="block rounded-[0.75rem] outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                      >
                        <div
                          className={cn(
                            "flex min-h-[4.5rem] items-center gap-3 rounded-[0.75rem] p-2 transition-colors duration-150 hover:bg-foreground/[0.035]",
                            activeIndex === index && "bg-foreground/[0.045]",
                          )}
                        >
                          <EntityCoverImage
                            src={result.cover_url}
                            alt={result.title}
                            sizes="56px"
                            quality={78}
                            variant="card"
                            className="size-14 shrink-0 rounded-[0.62rem] bg-muted/50 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                            iconClassName="size-5"
                          />

                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 font-pixel text-[0.95rem] font-medium text-foreground">
                              {result.title}
                            </h3>
                            <p className="line-clamp-1 text-[13px] text-muted-foreground/72">
                              {result.type === "artist"
                                ? "Artist"
                                : result.artist_name ?? "Unknown artist"}
                            </p>
                          </div>
                        </div>
                      </PrefetchLink>
                    );

                    return result.type === "track" ? (
                      <TrackContextMenu
                        key={`${result.provider}-${result.type}-${result.provider_id}`}
                        href={getResultHref(result)}
                        title={result.title}
                        artistName={result.artist_name}
                      >
                        {resultLink}
                      </TrackContextMenu>
                    ) : (
                      resultLink
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
