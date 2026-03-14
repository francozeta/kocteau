"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, LoaderCircle, Music2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [searchType, setSearchType] = useState<SearchEntityType>(initialType);
  const normalizedQuery = query.trim();
  const { data = [], isFetching, error } = useDeezerSearch({
    query,
    type: searchType,
    enabled: searchType === "track",
  });
  const results = data as DeezerSearchResult[];

  useEffect(() => {
    setQuery(initialQuery);
    setSearchType(initialType);
  }, [initialQuery, initialType]);

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
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight">Discover music</h1>
          <p className="text-muted-foreground">
            Search through thousands of tracks and discover what the community thinks.
          </p>
        </div>

        <div className="relative max-w-2xl">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by track, artist..."
            className="pl-12 py-3 bg-card/50 border-border/30 text-base"
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
                className="border-border/30 hover:border-border/60"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {resultCountLabel && (
          <p className="text-sm text-muted-foreground pt-2">{resultCountLabel}</p>
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
              No tracks found. Try a different search.
            </div>
          ) : null}

          {results.map((result) => (
            <Link
              key={`${result.provider}-${result.provider_id}`}
              href={getResultHref(result)}
              className="block group"
            >
              <div className="border border-border/30 rounded-lg overflow-hidden bg-card/50 hover:bg-card hover:border-border/60 transition-all flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-muted rounded-md overflow-hidden">
                  {result.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.cover_url}
                      alt={result.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <Music2 className="size-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={result.entity_id ? "secondary" : "outline"} className="text-xs">
                      {result.entity_id ? "In Kocteau" : "From Deezer"}
                    </Badge>
                  </div>
                  <h3 className="font-medium group-hover:underline line-clamp-1">{result.title}</h3>
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
          <div className="space-y-2 border-t border-border/30 pt-6">
            <h2 className="font-serif text-2xl font-bold">Popular tracks</h2>
            <p className="text-sm text-muted-foreground">
              Explore what others are discussing right now.
            </p>
          </div>

          {highlights.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((track) => (
                <Link key={track.entityId} href={`/track/${track.entityId}`} className="group">
                  <div className="overflow-hidden rounded-lg border border-border/30 bg-card/50 hover:border-border/60 hover:bg-card transition-all">
                    <div className="aspect-square bg-muted overflow-hidden">
                      {track.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Music2 className="size-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="line-clamp-2 font-medium group-hover:underline">{track.title}</h3>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {track.artistName ?? "Unknown artist"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDate(track.latestReviewAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tracks available yet.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
