"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, LoaderCircle, Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";
import EntityCoverImage from "@/components/entity-cover-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useDeezerSearch, type DeezerSearchResult } from "@/hooks/use-deezer-search";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/queries/http";
import {
  starterCuratorTracksQueryOptions,
  starterKeys,
  type StarterTrackRow,
} from "@/queries/starter";

type StarterTrackResponse = {
  ok: boolean;
  track: StarterTrackRow;
};

const defaultPrompt = "What should people pay attention to here?";

function TrackCover({
  src,
  title,
}: {
  src: string | null;
  title: string;
}) {
  return (
    <EntityCoverImage
      src={src}
      alt={`${title} cover`}
      sizes="56px"
      className="size-14 rounded-md border border-border/24 bg-muted/20"
      iconClassName="size-5"
    />
  );
}

export default function StarterStudioClient() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [featured, setFeatured] = useState(true);
  const normalizedQuery = query.trim();
  const starterTracksQuery = useQuery(starterCuratorTracksQueryOptions());
  const {
    data: searchResults,
    isFetching: searchFetching,
    error: searchError,
  } = useDeezerSearch({
    query,
    type: "track",
  });
  const starterTracks = useMemo(
    () => starterTracksQuery.data ?? [],
    [starterTracksQuery.data],
  );
  const existingProviderIds = useMemo(
    () => new Set(starterTracks.map((track) => track.provider_id)),
    [starterTracks],
  );

  const addMutation = useMutation({
    mutationFn: (track: DeezerSearchResult) =>
      fetchJson<StarterTrackResponse>("/api/starter/tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: track.provider,
          provider_id: track.provider_id,
          type: track.type,
          title: track.title,
          artist_name: track.artist_name,
          cover_url: track.cover_url,
          deezer_url: track.deezer_url,
          prompt,
          editorial_note: "Added from Starter Studio.",
          is_featured: featured,
          is_active: true,
          collection_slug: "starter-picks",
        }),
      }),
    onSuccess: (_payload, track) => {
      toast.success(`${track.title} added to Starter picks.`);
      void queryClient.invalidateQueries({ queryKey: starterKeys.curatorTracks() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<StarterTrackResponse>("/api/starter/tracks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      toast.success("Starter pick archived.");
      void queryClient.invalidateQueries({ queryKey: starterKeys.curatorTracks() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const pendingProviderId = addMutation.isPending
    ? addMutation.variables?.provider_id ?? null
    : null;
  const pendingArchiveId = archiveMutation.isPending
    ? archiveMutation.variables ?? null
    : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6">
      <header className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Kocteau editorial</p>
        <h1 className="font-serif text-3xl font-semibold tracking-normal text-foreground">
          Starter Studio
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Curate the first records people see when For You is still warming up.
        </p>
      </header>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Deezer tracks..."
            className="h-11 rounded-lg bg-card/42 pl-10 text-sm"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/38 bg-card/30 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground">Featured</p>
            <p className="truncate text-xs text-muted-foreground">
              Prioritize new picks
            </p>
          </div>
          <Switch
            checked={featured}
            onCheckedChange={setFeatured}
            aria-label="Prioritize this starter pick"
          />
        </div>
      </section>

      <Input
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Editorial prompt"
        className="h-9 rounded-lg bg-card/34 text-sm"
      />

      <div className="grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Deezer results</h2>
            {searchFetching ? (
              <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          <div className="space-y-2">
            {searchError ? (
              <p className="rounded-lg border border-destructive/34 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {searchError.message}
              </p>
            ) : null}

            {normalizedQuery.length < 2 ? (
              <p className="rounded-lg border border-border/34 bg-card/26 px-3 py-8 text-center text-sm text-muted-foreground">
                Search by track, artist, or album.
              </p>
            ) : null}

            {(searchResults ?? []).map((track) => {
              const alreadyAdded = existingProviderIds.has(track.provider_id);
              const isPending = pendingProviderId === track.provider_id;

              return (
                <article
                  key={track.provider_id}
                  className="grid min-h-[4.75rem] grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/34 bg-card/24 p-2.5"
                >
                  <TrackCover src={track.cover_url} title={track.title} />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-foreground">
                      {track.title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {track.artist_name ?? "Unknown artist"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={alreadyAdded ? "secondary" : "default"}
                    disabled={alreadyAdded || addMutation.isPending}
                    onClick={() => addMutation.mutate(track)}
                    className="gap-1.5"
                  >
                    {isPending ? (
                      <LoaderCircle className="size-3 animate-spin" />
                    ) : alreadyAdded ? (
                      <Star className="size-3" />
                    ) : (
                      <Plus className="size-3" />
                    )}
                    {alreadyAdded ? "Added" : "Add"}
                  </Button>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Starter picks</h2>
            <span className="text-xs text-muted-foreground">
              {starterTracks.length}
            </span>
          </div>

          <div className="space-y-2">
            {starterTracksQuery.isLoading ? (
              <div className="flex min-h-24 items-center justify-center rounded-lg border border-border/34 bg-card/24">
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : null}

            {!starterTracksQuery.isLoading && starterTracks.length === 0 ? (
              <p className="rounded-lg border border-border/34 bg-card/24 px-3 py-8 text-center text-sm text-muted-foreground">
                No starter picks yet.
              </p>
            ) : null}

            {starterTracks.map((track) => {
              const isArchiving = pendingArchiveId === track.id;

              return (
                <article
                  key={track.id}
                  className={cn(
                    "grid min-h-[4.5rem] grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-border/34 bg-card/24 p-2",
                    track.is_featured && "border-foreground/20",
                  )}
                >
                  <TrackCover src={track.cover_url} title={track.title} />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-foreground">
                      {track.title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {track.artist_name ?? "Unknown artist"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={archiveMutation.isPending}
                    onClick={() => archiveMutation.mutate(track.id)}
                    title="Archive starter pick"
                  >
                    {isArchiving ? (
                      <LoaderCircle className="size-3 animate-spin" />
                    ) : (
                      <Archive className="size-3" />
                    )}
                    <span className="sr-only">Archive starter pick</span>
                  </Button>
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
