"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, LoaderCircle, Music2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DiscoveryTrack } from "@/lib/queries/discovery";

type SearchResult = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
};

type SearchPageClientProps = {
  initialQuery: string;
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
  return new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  });
}

function getResultHref(result: SearchResult) {
  return result.entity_id ? `/track/${result.entity_id}` : `/track/deezer/${result.provider_id}`;
}

export default function SearchPageClient({ initialQuery, highlights }: SearchPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      setError(null);

      try {
        const response = await fetch(`/api/deezer/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("No pudimos buscar ahora mismo.");
        }

        const payload = (await response.json()) as SearchResult[];
        setResults(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setResults([]);
        setError("No pudimos buscar ahora mismo.");
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmed = query.trim();
      const next = new URLSearchParams(searchParams.toString());

      if (trimmed) {
        next.set("q", trimmed);
      } else {
        next.delete("q");
      }

      const current = searchParams.toString();
      const updated = next.toString();

      if (current !== updated) {
        router.replace(updated ? `${pathname}?${updated}` : pathname, { scroll: false });
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [pathname, query, router, searchParams]);

  const hasQuery = query.trim().length > 0;
  const resultCountLabel = useMemo(() => {
    if (!hasQuery) return null;
    if (searching) return "Buscando...";
    return `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`;
  }, [hasQuery, results.length, searching]);

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
                  Busca en Deezer, abre la pagina del track y si ya existe en Kocteau
                  entras directo a su version canonica.
                </CardDescription>
              </div>
            </div>

            {resultCountLabel ? (
              <p className="text-sm text-muted-foreground">{resultCountLabel}</p>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-5 py-5">
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

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {hasQuery ? (
        <div className="grid gap-3">
          {searching ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Buscando en Deezer...
              </CardContent>
            </Card>
          ) : null}

          {!searching && results.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No encontramos tracks</CardTitle>
                <CardDescription>
                  Prueba otro nombre de cancion, artista o una combinacion de ambos.
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
                        ? "Este track ya tiene entidad interna. Entraras a su pagina local."
                        : "Todavia no existe en Kocteau. Entraras por Deezer ID y la primera review lo convertira en entidad local."}
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
                Una entrada rapida a lo que ya se esta reseñando en la demo.
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
                          Ultima review: {formatDate(track.latestReviewAt)}
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
                <CardTitle>Todavia no hay tracks en Kocteau</CardTitle>
                <CardDescription>
                  Usa el buscador de arriba y publica la primera review para empezar el catalogo.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
