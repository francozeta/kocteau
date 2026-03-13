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
    <div className="space-y-6">
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Badge variant="secondary">Discovery</Badge>
              <div>
                <CardTitle className="text-2xl">Search tracks</CardTitle>
                <CardDescription className="mt-2 max-w-2xl">
                  Search through Deezer, open a track page, and jump straight into the
                  canonical Kocteau page when it already exists.
                </CardDescription>
              </div>
            </div>

            {resultCountLabel ? (
              <p className="text-sm text-muted-foreground">{resultCountLabel}</p>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-5">
          <Tabs value={searchType} onValueChange={(value) => setSearchType(value as SearchEntityType)}>
            <TabsList variant="line" className="w-full justify-start rounded-none p-0">
              <TabsTrigger value="track" className="flex-none px-0 pr-4">
                Tracks
              </TabsTrigger>
              <TabsTrigger value="artist" disabled className="flex-none px-0 pr-4">
                Artists
              </TabsTrigger>
              <TabsTrigger value="album" disabled className="flex-none px-0 pr-4">
                Albums
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: Charli xcx, Deftones, Radiohead..."
              className="pl-9"
              autoFocus
            />
          </div>

          {!hasQuery ? (
            <div className="flex flex-wrap gap-2">
              {suggestedSearches.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            The demo currently searches `track`. `artist` and `album` are already typed
            for the next phase.
          </p>

          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
        </CardContent>
      </Card>

      {hasQuery ? (
        <div className="grid gap-3">
          {isFetching ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Searching Deezer...
              </CardContent>
            </Card>
          ) : null}

          {!isFetching && normalizedQuery.length > 0 && normalizedQuery.length < 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>Keep typing</CardTitle>
                <CardDescription>
                  We need at least 2 characters before we can search.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {!isFetching && normalizedQuery.length >= 2 && results.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No tracks found</CardTitle>
                <CardDescription>
                  Try another song title, artist name, or a mix of both.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {results.map((result) => (
            <Link
              key={`${result.provider}-${result.provider_id}`}
              href={getResultHref(result)}
              className="block transition-transform hover:-translate-y-0.5"
            >
              <Card className="overflow-hidden py-0">
                <CardContent className="grid gap-0 p-0 sm:grid-cols-[88px_1fr_auto]">
                  <div className="flex h-24 items-center justify-center bg-muted sm:h-full">
                    {result.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.cover_url}
                        alt={result.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Music2 className="size-7 text-muted-foreground" />
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={result.entity_id ? "secondary" : "outline"}>
                          {result.entity_id ? "Already in Kocteau" : "From Deezer"}
                        </Badge>
                        <Badge variant="outline">track</Badge>
                      </div>

                      <h2 className="text-lg font-semibold">{result.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {result.artist_name ?? "Unknown artist"}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {result.entity_id
                        ? "This track already has a local entity. You will open its Kocteau page."
                        : "This track does not exist in Kocteau yet. You will enter through Deezer ID and the first review will create its local entity."}
                    </p>
                  </div>

                  <div className="hidden items-center justify-center px-5 sm:flex">
                    <ArrowUpRight className="size-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-semibold">Recently discussed tracks</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A quick way into what is already being reviewed in the demo.
              </p>
            </div>
          </div>

          {highlights.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {highlights.map((track) => (
                <Link key={track.entityId} href={`/track/${track.entityId}`} className="block">
                  <Card className="overflow-hidden py-0 transition-transform hover:-translate-y-0.5">
                    <CardContent className="space-y-4 p-0">
                      <div className="aspect-square bg-muted">
                        {track.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Music2 className="size-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 px-5 pb-5">
                        <h3 className="line-clamp-1 font-semibold">{track.title}</h3>
                        <p className="line-clamp-1 text-sm text-muted-foreground">
                          {track.artistName ?? "Unknown artist"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Latest review: {formatDate(track.latestReviewAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>There are no tracks in Kocteau yet</CardTitle>
                <CardDescription>
                  Use the search above and publish the first review to start the catalog.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
