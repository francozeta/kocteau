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
import type { SearchEntityType, SearchScope } from "@/lib/search-types";
import { normalizeSearchText } from "@/lib/search/kocteau-first";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";
import { cn } from "@/lib/utils";

type SearchPageClientProps = {
  initialQuery: string;
  initialType: SearchScope;
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
  return buildEntityCanonicalPath({
    id: result.entity_id,
    provider: result.provider,
    provider_id: result.provider_id,
    type: result.type,
    title: result.title,
    artist_name: result.artist_name,
  });
}

const searchScopeOptions = [
  { value: "all", label: "All" },
  { value: "track", label: "Songs" },
  { value: "album", label: "Albums" },
  { value: "artist", label: "Artists" },
] satisfies Array<{ value: SearchScope; label: string }>;

const resultTypeOrder = ["artist", "album", "track"] satisfies SearchEntityType[];

function getResultIdentity(result: KocteauSearchResult) {
  return `${result.provider}:${result.type}:${result.provider_id}`;
}

function getReleaseYear(result: KocteauSearchResult) {
  const date = result.first_release_date ?? result.release_date;
  const year = date?.match(/^\d{4}/)?.[0];

  return year ?? null;
}

function formatCatalogType(value: string | null | undefined) {
  if (!value) return null;

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getResultContext(result: KocteauSearchResult) {
  const year = getReleaseYear(result);
  const genre = result.genres?.[0] ?? null;

  if (result.type === "artist") {
    return [formatCatalogType(result.artist_type) ?? "Artist", result.country_code, genre]
      .filter(Boolean)
      .join(" · ");
  }

  if (result.type === "album") {
    return [
      result.artist_name,
      year,
      formatCatalogType(result.album_record_type) ?? "Album",
    ]
      .filter(Boolean)
      .join(" · ");
  }

  return [result.artist_name, year, genre].filter(Boolean).join(" · ");
}

function getResultSectionTitle(type: SearchEntityType) {
  if (type === "artist") return "Artists";
  if (type === "album") return "Albums";
  return "Songs";
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
  const [searchType, setSearchType] = useState<SearchScope>(initialType);
  const [activeIndexState, setActiveIndexState] = useState<ActiveSearchResultState>({
    key: "",
    index: -1,
  });
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);
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
  const searchGroups = useMemo(() => {
    const visibleTypes: SearchEntityType[] =
      searchType === "all" ? resultTypeOrder : [searchType];
    const normalizedSearchQuery = normalizeSearchText(normalizedQuery);

    const groups = visibleTypes
      .map((type) => ({
        type,
        title: getResultSectionTitle(type),
        results: results.filter((result) => result.type === type),
      }))
      .filter((group) => group.results.length > 0);

    if (searchType !== "all") {
      return groups;
    }

    return groups.sort((left, right) => {
      function getIntentRank(group: (typeof groups)[number]) {
        const exactMatches = group.results.filter(
          (result) => normalizeSearchText(result.title) === normalizedSearchQuery,
        );

        if (exactMatches.some((result) => result.entity_id)) return 2;
        if (exactMatches.length > 0) return 1;
        return 0;
      }

      const intentDifference = getIntentRank(right) - getIntentRank(left);

      if (intentDifference !== 0) return intentDifference;

      return resultTypeOrder.indexOf(left.type) - resultTypeOrder.indexOf(right.type);
    });
  }, [normalizedQuery, results, searchType]);
  const orderedResults = useMemo(
    () => searchGroups.flatMap((group) => group.results),
    [searchGroups],
  );
  const resultIndexByIdentity = useMemo(
    () =>
      new Map(
        orderedResults.map((result, index) => [getResultIdentity(result), index]),
      ),
    [orderedResults],
  );
  const activeResultKey = useMemo(
    () =>
      [
        normalizedQuery,
        searchType,
        ...orderedResults.map(getResultIdentity),
      ].join("|"),
    [normalizedQuery, orderedResults, searchType],
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

      if (searchType !== "all") {
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

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (normalizedQuery.length < 2 || orderedResults.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % orderedResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? orderedResults.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const activeResult = orderedResults[activeIndex];
      persistRecentSearch(activeResult.title);
      router.push(getResultHref(activeResult));
    }
  }

  return (
    <div className="w-full max-w-5xl lg:max-w-none">
      <div className="min-w-0 space-y-6">
        {hasQuery ? (
          <div className="space-y-3">
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
                placeholder="Search songs, albums, or artists…"
                className="mobile-liquid-panel h-11 rounded-[var(--kocteau-radius-control)] border-transparent bg-[var(--kocteau-surface-control)] pl-10 text-base shadow-[var(--kocteau-shadow-control)] placeholder:text-muted-foreground/58 sm:text-[13px]"
                autoFocus={!isMobile}
                maxLength={80}
              />
            </div>

            <div
              className="flex min-h-8 items-center gap-5 px-1"
              role="group"
              aria-label="Filter music search"
            >
              {searchScopeOptions.map((option) => {
                const isActive = searchType === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSearchType(option.value)}
                    className={cn(
                      "relative inline-flex min-h-8 items-center text-[12px] font-medium text-muted-foreground/58 outline-none transition-colors duration-150 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-center after:scale-x-0 after:bg-foreground/72 after:transition-transform after:duration-150 hover:text-foreground/84 focus-visible:ring-2 focus-visible:ring-ring/35",
                      isActive && "text-foreground after:scale-x-100",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

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

        {!hasQuery ? discoverContent : null}

        {hasQuery ? (
          <div className="max-w-3xl space-y-8" aria-live="polite">
            {showSkeletonResults ? (
              <div className="grid gap-1" aria-label="Searching music">
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
                  Try another song, album, or artist.
                </p>
              </div>
            ) : null}

            {searchGroups.map((group, groupIndex) => (
              <section
                key={group.type}
                className="space-y-2"
                aria-labelledby={`search-${group.type}-heading`}
              >
                <div className="flex min-h-6 items-center gap-2 px-2">
                  <h2
                    id={`search-${group.type}-heading`}
                    className="text-[13px] font-semibold text-foreground/92"
                  >
                    {group.title}
                  </h2>
                  {groupIndex === 0 && isFetching ? (
                    <LoaderCircle className="size-3 animate-spin text-muted-foreground/48" />
                  ) : null}
                </div>

                <div className="grid gap-1">
                  {group.results.map((result) => {
                    const resultIdentity = getResultIdentity(result);
                    const index = resultIndexByIdentity.get(resultIdentity) ?? -1;
                    const context = getResultContext(result);
                    const resultLink = (
                      <PrefetchLink
                        key={resultIdentity}
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
                            className={cn(
                              "size-14 shrink-0 bg-muted/50 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
                              result.type === "artist"
                                ? "rounded-full"
                                : "rounded-[0.62rem]",
                            )}
                            iconClassName="size-5"
                          />

                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 font-pixel text-[0.95rem] font-medium text-foreground">
                              {result.title}
                            </h3>
                            <p className="line-clamp-1 text-[13px] text-muted-foreground/72">
                              {context}
                            </p>
                          </div>
                        </div>
                      </PrefetchLink>
                    );

                    return result.type === "track" ? (
                      <TrackContextMenu
                        key={resultIdentity}
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
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
