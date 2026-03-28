"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, LoaderCircle, Music2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeezerSearch, type DeezerSearchResult } from "@/hooks/use-deezer-search";
import type { DiscoveryTrack } from "@/lib/queries/discovery";
import type { SearchEntityType } from "@/lib/search-types";

type SearchPageClientProps = {
  initialQuery: string;
  initialType: SearchEntityType;
  highlights: DiscoveryTrack[];
};

const suggestedSearches = [
  "Massive Attack",
  "Rosalia",
  "The Cure",
  "FKA twigs",
  "Daft Punk",
  "Frank Ocean",
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function getResultHref(result: DeezerSearchResult) {
  return result.entity_id ? `/track/${result.entity_id}` : `/track/deezer/${result.provider_id}`;
}

export default function SearchPageClient({
  initialQuery,
  initialType,
  highlights,
}: SearchPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const searchType = initialType;
  const normalizedQuery = query.trim();
  const { data = [], isFetching, error } = useDeezerSearch({
    query,
    type: searchType,
    enabled: searchType === "track",
  });
  const results = data as DeezerSearchResult[];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());

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

      const current = searchParams.toString();
      const updated = next.toString();

      if (current !== updated) {
        startTransition(() => {
          router.replace(updated ? `${pathname}?${updated}` : pathname, { scroll: false });
        });
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [normalizedQuery, pathname, router, searchParams, searchType]);

  const hasQuery = normalizedQuery.length > 0;
  const resultCountLabel = useMemo(() => {
    if (!hasQuery) return null;
    if (isFetching) return "Searching...";
    return `${results.length} ${results.length === 1 ? "result" : "results"}`;
  }, [hasQuery, isFetching, results.length]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-border/30 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
              Search
            </h1>
            {resultCountLabel ? (
              <p className="text-sm text-muted-foreground">{resultCountLabel}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by track, artist..."
            className="h-12 rounded-[1.35rem] border-border/25 bg-card/20 pl-12 text-base"
            autoFocus
          />
        </div>

        {!hasQuery && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestedSearches.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuery(suggestion)}
                className="rounded-full border-border/25 bg-card/18 hover:border-border/50"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error.message}</p>}
      </div>

      {hasQuery ? (
        <div className="space-y-3">
          {isFetching ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground justify-center">
              <LoaderCircle className="size-4 animate-spin" />
              Searching...
            </div>
          ) : null}

          {!isFetching && normalizedQuery.length > 0 && normalizedQuery.length < 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          ) : null}

          {!isFetching && normalizedQuery.length >= 2 && results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results
            </div>
          ) : null}

          {results.map((result) => (
            <Link
              key={`${result.provider}-${result.provider_id}`}
              href={getResultHref(result)}
              className="group block"
            >
              <div className="flex items-center gap-4 rounded-[1.5rem] border border-border/20 bg-card/18 px-3.5 py-3.5 transition-colors hover:bg-card/30">
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
                  <h3 className="line-clamp-1 font-medium group-hover:underline">{result.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {result.artist_name ?? "Unknown artist"}
                  </p>
                </div>

                <div className="hidden sm:block">
                  <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-border/25 pb-4">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Active tracks
            </h2>
            <p className="text-sm text-muted-foreground">
              {highlights.length} {highlights.length === 1 ? "track" : "tracks"}
            </p>
          </div>

          {highlights.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((track) => (
                <Link
                  key={track.entityId}
                  href={`/track/${track.entityId}`}
                  className="group flex items-center gap-3 rounded-[1.45rem] border border-border/20 bg-card/18 px-3.5 py-3.5 transition-colors hover:bg-card/30"
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
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tracks yet
            </div>
          )}
        </section>
      )}
    </div>
  );
}
