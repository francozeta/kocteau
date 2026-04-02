"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LoaderCircle, Music2, Search } from "lucide-react";
import PrefetchLink from "@/components/prefetch-link";
import TrackContextMenu from "@/components/track-context-menu";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDeezerSearch, type DeezerSearchResult } from "@/hooks/use-deezer-search";
import type { DiscoveryTrack } from "@/lib/queries/discovery";
import type { SearchEntityType } from "@/lib/search-types";
import { cn } from "@/lib/utils";

type SearchPageClientProps = {
  initialQuery: string;
  initialType: SearchEntityType;
  highlights: DiscoveryTrack[];
};

type RecentSearch = {
  label: string;
  query: string;
};

const suggestedSearches = [
  "Massive Attack",
  "Rosalia",
  "The Cure",
  "FKA twigs",
  "Daft Punk",
  "Frank Ocean",
];

const recentSearchesStorageKey = "kocteau:recent-searches";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function getResultHref(result: DeezerSearchResult) {
  return result.entity_id ? `/track/${result.entity_id}` : `/track/deezer/${result.provider_id}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text: string, query: string) {
  const normalized = query.trim();

  if (!normalized || normalized.length < 2) {
    return text;
  }

  const matcher = new RegExp(`(${escapeRegExp(normalized)})`, "ig");
  const parts = text.split(matcher);
  const normalizedLower = normalized.toLowerCase();

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedLower ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-[0.35rem] bg-foreground/10 px-0.5 text-foreground"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

export default function SearchPageClient({
  initialQuery,
  initialType,
  highlights,
}: SearchPageClientProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const searchType = initialType;
  const normalizedQuery = query.trim();
  const { data = [], isFetching, error } = useDeezerSearch({
    query,
    type: searchType,
    enabled: searchType === "track",
  });
  const results = data as DeezerSearchResult[];

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(recentSearchesStorageKey);

      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as RecentSearch[];

      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, 6));
      }
    } catch {
      // Ignore broken local storage payloads and fall back to empty recent searches.
    }
  }, []);

  useEffect(() => {
    if (normalizedQuery.length < 2 || results.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex(0);
  }, [normalizedQuery, results.length]);

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
  const resultCountLabel = useMemo(() => {
    if (!hasQuery) return null;
    return `${results.length} ${results.length === 1 ? "result" : "results"}`;
  }, [hasQuery, results.length]);

  const showSkeletonResults =
    hasQuery && normalizedQuery.length >= 2 && isFetching && results.length === 0;

  function persistRecentSearch(nextQuery: string) {
    const label = nextQuery.trim();

    if (label.length < 2 || typeof window === "undefined") {
      return;
    }

    const nextItem = {
      label,
      query: label,
    } satisfies RecentSearch;

    setRecentSearches((current) => {
      const next = [nextItem, ...current.filter((item) => item.query.toLowerCase() !== label.toLowerCase())].slice(0, 6);
      window.localStorage.setItem(recentSearchesStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function clearRecentSearches() {
    setRecentSearches([]);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(recentSearchesStorageKey);
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
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
      <div className="border-b border-border/34 pb-4 md:border-border/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
              Explore
            </h1>
            {resultCountLabel ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{resultCountLabel}</span>
                {isFetching ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LoaderCircle className="size-3.5 animate-spin" />
                    Updating…
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Search directly or browse what is active right now.
              </p>
            )}
          </div>

          {!hasQuery ? (
            <Link
              href="/track"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Open Track Index
            </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-global-search-input="true"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search tracks or artists…"
            className="h-12 rounded-[1.35rem] border-border/34 bg-card/26 pl-12 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/25 md:bg-card/20"
            autoFocus={!isMobile}
            maxLength={80}
          />
        </div>

        {!hasQuery && (
          <div className="grid gap-4 pt-2 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              {recentSearches.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Recent
                    </p>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <Button
                        key={item.query}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearchSuggestionSelect(item.query)}
                        className="rounded-full border-border/34 bg-card/24 hover:border-border/50 md:border-border/25 md:bg-card/18"
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Suggested
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedSearches.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearchSuggestionSelect(suggestion)}
                      className="rounded-full border-border/34 bg-card/24 hover:border-border/50 md:border-border/25 md:bg-card/18"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[1.45rem] border border-border/32 bg-card/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Browse
                </p>
                <p className="text-base font-medium text-foreground">Track Index</p>
                <p className="text-sm text-muted-foreground">
                  Browse tracks with recent review activity without starting with a query.
                </p>
                <div className="pt-1">
                  <Link
                    href="/track"
                    className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
                  >
                    Open the index
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error.message}</p>}
      </div>

      {hasQuery ? (
        <div className="space-y-3">
          {showSkeletonResults ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-[1.5rem] border border-border/32 bg-card/24 px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] md:border-border/20 md:bg-card/18"
                >
                  <Skeleton className="h-16 w-16 rounded-[1.1rem]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-18" />
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3.5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!showSkeletonResults && normalizedQuery.length > 0 && normalizedQuery.length < 2 ? (
            <Empty className="rounded-[1.6rem] border-border/32 bg-card/24 px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="size-4" />
                </EmptyMedia>
                <EmptyTitle>Keep typing</EmptyTitle>
                <EmptyDescription>
                  Type at least 2 characters to search.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {!showSkeletonResults && normalizedQuery.length >= 2 && results.length === 0 ? (
            <Empty className="rounded-[1.6rem] border-border/32 bg-card/24 px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No results</EmptyTitle>
                <EmptyDescription>
                  Try another track or artist.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {results.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Matches
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Use ↑ ↓ to move, Enter to open
                </p>
              </div>
              {results.map((result, index) => (
                <TrackContextMenu
                  key={`${result.provider}-${result.provider_id}`}
                  href={getResultHref(result)}
                  title={result.title}
                  artistName={result.artist_name}
                >
                  <PrefetchLink
                    href={getResultHref(result)}
                    queryWarmup={
                      result.entity_id
                        ? { kind: "track", id: result.entity_id }
                        : undefined
                    }
                    onClick={() => persistRecentSearch(result.title)}
                    ref={(node) => {
                      resultRefs.current[index] = node;
                    }}
                    className="group block"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-4 rounded-[1.5rem] border border-border/32 bg-card/24 px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-colors hover:bg-card/32 md:border-border/20 md:bg-card/18 md:hover:bg-card/30",
                        activeIndex === index && "border-foreground/28 bg-card/32 md:border-foreground/20 md:bg-card/28",
                      )}
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] bg-muted">
                        {result.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={result.cover_url}
                            alt={result.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <Music2 className="size-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          <span>{result.entity_id ? "In library" : "Deezer"}</span>
                        </div>
                        <h3 className="line-clamp-1 font-medium group-hover:underline">
                          {highlightMatch(result.title, normalizedQuery)}
                        </h3>
                        <p className="line-clamp-1 text-sm text-muted-foreground">
                          {highlightMatch(result.artist_name ?? "Unknown artist", normalizedQuery)}
                        </p>
                      </div>

                      <div className="hidden sm:block">
                        {activeIndex === index ? (
                          <span className="inline-flex rounded-full border border-border/36 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground md:border-border/30">
                            Enter
                          </span>
                        ) : (
                          <ArrowUpRight className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                        )}
                      </div>
                    </div>
                  </PrefetchLink>
                </TrackContextMenu>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-border/32 pb-4 md:border-border/25">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Active tracks
            </h2>
            <Link
              href="/track"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Track Index
            </Link>
          </div>

          {highlights.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((track) => (
                <TrackContextMenu
                  key={track.entityId}
                  href={`/track/${track.entityId}`}
                  title={track.title}
                  artistName={track.artistName}
                >
                  <PrefetchLink
                    href={`/track/${track.entityId}`}
                    queryWarmup={{ kind: "track", id: track.entityId }}
                    className="group flex items-center gap-3 rounded-[1.45rem] border border-border/32 bg-card/24 px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-colors hover:bg-card/32 md:border-border/20 md:bg-card/18 md:hover:bg-card/30"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-muted">
                      {track.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <Music2 className="size-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 font-medium group-hover:underline">{track.title}</h3>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {track.artistName ?? "Unknown artist"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(track.latestReviewAt)}
                      </p>
                    </div>
                  </PrefetchLink>
                </TrackContextMenu>
              ))}
            </div>
          ) : (
            <Empty className="rounded-[1.6rem] border-border/32 bg-card/24 px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Music2 className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No tracks yet</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      )}
    </div>
  );
}
