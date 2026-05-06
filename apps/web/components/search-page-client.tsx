"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Clock, Disc3, LoaderCircle, Music2, Search } from "lucide-react";
import EntityCoverImage from "@/components/entity-cover-image";
import { Kbd } from "@/components/ui/kbd";
import PrefetchLink from "@/components/prefetch-link";
import TrackContextMenu from "@/components/track-context-menu";
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

function SearchSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-muted-foreground/72">
      {children}
    </p>
  );
}

function SuggestionRow({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition hover:bg-foreground/[0.045]"
    >
      <span className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground/68">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-foreground/90">{children}</span>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/48 transition group-hover:text-muted-foreground/78" />
    </button>
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
    <div className="mx-auto flex w-full max-w-[52rem] flex-col gap-5 sm:gap-6">
      <section className="overflow-hidden rounded-[1rem] border border-border/24 bg-[var(--kocteau-surface)] shadow-[0_18px_52px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.035)]">
        <div className="border-b border-border/18 p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-[12px] font-medium text-muted-foreground/82">
              <Search className="size-3.5" />
              Explore catalog
            </div>
            {hasQuery && resultCountLabel ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/72">
                {isFetching ? <LoaderCircle className="size-3 animate-spin" /> : null}
                {isFetching ? "Updating" : resultCountLabel}
              </span>
            ) : null}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/78" />
            <Input
              data-global-search-input="true"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search tracks to explore…"
              className="mobile-liquid-panel h-10 rounded-[0.75rem] border-border/24 bg-[var(--kocteau-surface-control)] pl-10 text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-muted-foreground/72"
              autoFocus={!isMobile}
              maxLength={80}
            />
          </div>

          {error ? <p className="mt-3 text-sm text-destructive">{error.message}</p> : null}
        </div>

        {!hasQuery ? (
          <div className="divide-y divide-border/16">
            {recentSearches.length > 0 ? (
              <div>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <SearchSectionLabel>Recent</SearchSectionLabel>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="divide-y divide-border/16">
                  {recentSearches.map((item) => (
                    <SuggestionRow
                      key={item.query}
                      icon={<Clock className="size-3.5" />}
                      onClick={() => handleSearchSuggestionSelect(item.query)}
                    >
                      {item.label}
                    </SuggestionRow>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <div className="px-4 py-2.5">
                <SearchSectionLabel>Starting points</SearchSectionLabel>
              </div>
              <div className="divide-y divide-border/16">
                {suggestedSearches.map((suggestion) => (
                  <SuggestionRow
                    key={suggestion}
                    icon={<Search className="size-3.5" />}
                    onClick={() => handleSearchSuggestionSelect(suggestion)}
                  >
                    {suggestion}
                  </SuggestionRow>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {hasQuery ? (
        <section className="space-y-3">
          {showSkeletonResults ? (
            <div className="overflow-hidden rounded-[1rem] border border-border/24 bg-[var(--kocteau-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <div className="space-y-0 divide-y divide-border/16">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 px-3 py-3">
                    <Skeleton className="size-14 rounded-[0.75rem] bg-foreground/[0.07]" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3 w-16 bg-foreground/[0.055]" />
                      <Skeleton className="h-4 w-2/5 bg-foreground/[0.075]" />
                      <Skeleton className="h-3.5 w-1/3 bg-foreground/[0.055]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!showSkeletonResults && normalizedQuery.length > 0 && normalizedQuery.length < 2 ? (
            <Empty className="rounded-[1rem] border-border/24 bg-[var(--kocteau-surface)] px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
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
            <Empty className="rounded-[1rem] border-border/24 bg-[var(--kocteau-surface)] px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
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
            <div className="overflow-hidden rounded-[1rem] border border-border/24 bg-[var(--kocteau-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <div className="flex items-center justify-between gap-3 border-b border-border/18 px-4 py-2.5">
                <SearchSectionLabel>Matches</SearchSectionLabel>
                <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground/64 sm:flex">
                  <Kbd className="h-5 rounded-md border-border/28 bg-foreground/[0.055] px-1.5 text-[0.625rem]">
                    ↑
                  </Kbd>
                  <Kbd className="h-5 rounded-md border-border/28 bg-foreground/[0.055] px-1.5 text-[0.625rem]">
                    ↓
                  </Kbd>
                  <span>Enter to open</span>
                </div>
              </div>
              <div className="divide-y divide-border/16">
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
                          "flex min-h-[4.75rem] items-center gap-3 px-3 py-3 transition-colors hover:bg-foreground/[0.045]",
                          activeIndex === index && "bg-foreground/[0.06]",
                        )}
                      >
                        <EntityCoverImage
                          src={result.cover_url}
                          alt={result.title}
                          sizes="56px"
                          quality={78}
                          variant="card"
                          className="size-14 shrink-0 rounded-[0.75rem] bg-muted/50 shadow-[0_0_0_1px_rgba(255,255,255,0.055)]"
                          imageClassName="transition-transform duration-300 group-hover:scale-[1.035]"
                          iconClassName="size-5"
                        />

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-1 text-[14px] font-semibold text-foreground">
                            {highlightMatch(result.title, normalizedQuery)}
                          </h3>
                          <p className="line-clamp-1 text-[13px] text-muted-foreground/84">
                            {highlightMatch(result.artist_name ?? "Unknown artist", normalizedQuery)}
                          </p>
                          <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/62">
                            <Disc3 className="size-3" />
                            <span>Track</span>
                            <span aria-hidden="true">·</span>
                            <span>{result.entity_id ? "In library" : "Deezer"}</span>
                          </div>
                        </div>

                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/48 transition group-hover:text-muted-foreground/78" />
                      </div>
                    </PrefetchLink>
                  </TrackContextMenu>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <SearchSectionLabel>Recently discussed</SearchSectionLabel>
          </div>

          {highlights.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
                    className="group block overflow-hidden rounded-[1rem] border border-border/22 bg-[var(--kocteau-surface)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-[background-color,transform] hover:bg-[var(--kocteau-surface-raised)] active:scale-[0.99]"
                  >
                    <div className="space-y-2.5">
                      <EntityCoverImage
                        src={track.coverUrl}
                        alt={track.title}
                        sizes="(max-width: 639px) 46vw, (max-width: 1023px) 30vw, 220px"
                        quality={82}
                        variant="card"
                        className="aspect-square w-full rounded-[0.8rem] bg-muted/50 shadow-[0_0_0_1px_rgba(255,255,255,0.055)]"
                        imageClassName="transition-transform duration-300 group-hover:scale-[1.025]"
                        iconClassName="size-6"
                      />

                      <div className="min-w-0 px-0.5 pb-0.5">
                        <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/62">
                          <Disc3 className="size-3" />
                          <span>{formatDate(track.latestReviewAt)}</span>
                        </div>
                        <h3 className="line-clamp-1 text-[14px] font-semibold text-foreground">
                          {track.title}
                        </h3>
                        <p className="line-clamp-1 text-[13px] text-muted-foreground/84">
                          {track.artistName ?? "Unknown artist"}
                        </p>
                      </div>
                    </div>
                  </PrefetchLink>
                </TrackContextMenu>
              ))}
            </div>
          ) : (
            <Empty className="rounded-[1rem] border-border/24 bg-[var(--kocteau-surface)] px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
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
