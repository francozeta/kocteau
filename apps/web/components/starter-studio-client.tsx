"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Tags,
  X,
} from "lucide-react";
import { toast } from "sonner";
import EntityCoverImage from "@/components/entity-cover-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useDeezerSearch, type DeezerSearchResult } from "@/hooks/use-deezer-search";
import { preferenceKindLabels, type PreferenceKind } from "@/lib/taste";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/queries/http";
import {
  starterCuratorTracksQueryOptions,
  starterKeys,
  type StarterPreferenceTag,
  type StarterTrackRow,
  type StarterTrackWithTags,
} from "@/queries/starter";

type StarterTrackResponse = {
  ok: boolean;
  track: StarterTrackRow;
};

type StarterTagResponse = {
  ok: boolean;
  tag: StarterPreferenceTag;
};

type MusicLinkBackfillResponse = {
  ok: boolean;
  processed: number;
  synced: number;
  linksResolved: number;
  entitiesCreated: number;
  skipped: number;
  providerStatus: {
    serviceRoleConfigured: boolean;
    spotifyConfigured: boolean;
    appleMusicConfigured: boolean;
  };
};

type StarterDraftTrack = Pick<
  StarterTrackRow,
  | "provider"
  | "provider_id"
  | "type"
  | "title"
  | "artist_name"
  | "cover_url"
  | "deezer_url"
>;

const defaultPrompt = "What should people pay attention to here?";
const starterTagLimit = 6;
const starterTagKinds = [
  "genre",
  "mood",
  "scene",
  "style",
] as const satisfies readonly PreferenceKind[];

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
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(() => new Set());
  const [tagQuery, setTagQuery] = useState("");
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagKind, setNewTagKind] = useState<PreferenceKind>("mood");
  const [editingTrack, setEditingTrack] =
    useState<StarterTrackWithTags | null>(null);
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
  const starterTracks: StarterTrackWithTags[] = useMemo(
    () => starterTracksQuery.data?.tracks ?? [],
    [starterTracksQuery.data],
  );
  const availableTags = useMemo(
    () => starterTracksQuery.data?.tags ?? [],
    [starterTracksQuery.data],
  );
  const existingProviderIds = useMemo(
    () => new Set(starterTracks.map((track) => track.provider_id)),
    [starterTracks],
  );
  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIds.has(tag.id)),
    [availableTags, selectedTagIds],
  );
  const filteredTags = useMemo(() => {
    const normalizedTagQuery = tagQuery.trim().toLowerCase();

    return availableTags
      .filter((tag) => {
        if (!normalizedTagQuery) {
          return tag.is_featured;
        }

        return `${tag.label} ${tag.slug} ${tag.kind}`
          .toLowerCase()
          .includes(normalizedTagQuery);
      })
      .slice(0, 36);
  }, [availableTags, tagQuery]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) => {
      const next = new Set(current);

      if (next.has(tagId)) {
        next.delete(tagId);
        return next;
      }

      if (next.size >= starterTagLimit) {
        toast.error(`Choose ${starterTagLimit} starter tags or fewer.`);
        return current;
      }

      next.add(tagId);
      return next;
    });
  }

  function resetDraft() {
    setEditingTrack(null);
    setPrompt(defaultPrompt);
    setFeatured(true);
    setSelectedTagIds(new Set());
    setTagQuery("");
  }

  function startEditing(track: StarterTrackWithTags) {
    setEditingTrack(track);
    setPrompt(track.prompt ?? defaultPrompt);
    setFeatured(track.is_featured);
    setSelectedTagIds(
      new Set((track.starter_track_tags ?? []).map((tag) => tag.tag_id)),
    );
    setTagQuery("");
  }

  const addMutation = useMutation({
    mutationFn: (track: DeezerSearchResult | StarterDraftTrack) => {
      const existingTrack = starterTracks.find(
        (starterTrack) => starterTrack.provider_id === track.provider_id,
      );
      const isEditingThisTrack = editingTrack?.provider_id === track.provider_id;
      const tagIds = selectedTagIds.size
        ? Array.from(selectedTagIds)
        : isEditingThisTrack
          ? []
        : (existingTrack?.starter_track_tags ?? []).map((tag) => tag.tag_id);

      return fetchJson<StarterTrackResponse>("/api/starter/tracks", {
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
          tag_ids: tagIds,
          collection_slug: "starter-picks",
        }),
      });
    },
    onSuccess: (_payload, track) => {
      toast.success(`${track.title} saved to Starter picks.`);
      if (editingTrack?.provider_id === track.provider_id) {
        resetDraft();
      }
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

  const createTagMutation = useMutation({
    mutationFn: () =>
      fetchJson<StarterTagResponse>("/api/starter/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: newTagLabel,
          kind: newTagKind,
          description: null,
          is_featured: true,
        }),
      }),
    onSuccess: (payload) => {
      toast.success(`${payload.tag.label} created.`);
      setSelectedTagIds((current) => new Set(current).add(payload.tag.id));
      setNewTagLabel("");
      setTagQuery("");
      void queryClient.invalidateQueries({ queryKey: starterKeys.curatorTracks() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const musicLinkBackfillMutation = useMutation({
    mutationFn: () =>
      fetchJson<MusicLinkBackfillResponse>("/api/starter/music-links/backfill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 24,
          includeExistingEntities: true,
          includeStarterTracks: true,
        }),
      }),
    onSuccess: (payload) => {
      const missingProviders = [
        payload.providerStatus.spotifyConfigured ? null : "Spotify",
        payload.providerStatus.appleMusicConfigured ? null : "Apple Music",
      ].filter(Boolean);

      toast.success(
        `Checked ${payload.processed} tracks, resolved ${payload.linksResolved} links.`,
        missingProviders.length
          ? {
              description: `${missingProviders.join(" and ")} credentials are not configured.`,
            }
          : undefined,
      );

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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Kocteau editorial</p>
          <h1 className="font-serif text-3xl font-semibold tracking-normal text-foreground">
            Starter Studio
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Curate the first records people see when For You is still warming up.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={musicLinkBackfillMutation.isPending}
          onClick={() => musicLinkBackfillMutation.mutate()}
          className="w-fit gap-1.5"
        >
          {musicLinkBackfillMutation.isPending ? (
            <LoaderCircle className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
          Sync links
        </Button>
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

      {editingTrack ? (
        <section className="grid gap-3 rounded-lg border border-primary/28 bg-primary/8 p-3 md:grid-cols-[3.5rem_minmax(0,1fr)_auto] md:items-center">
          <TrackCover src={editingTrack.cover_url} title={editingTrack.title} />
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">Editing starter pick</p>
            <h2 className="truncate text-sm font-semibold text-foreground">
              {editingTrack.title}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {editingTrack.artist_name ?? "Unknown artist"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={addMutation.isPending}
              onClick={resetDraft}
            >
              <X className="size-3" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={addMutation.isPending}
              onClick={() => addMutation.mutate(editingTrack)}
            >
              {addMutation.isPending &&
              addMutation.variables?.provider_id === editingTrack.provider_id ? (
                <LoaderCircle className="size-3 animate-spin" />
              ) : (
                <Check className="size-3" />
              )}
              Save changes
            </Button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-lg border border-border/34 bg-card/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Tags className="size-4 text-muted-foreground" />
            Starter signals
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={selectedTagIds.size === 0}
              onClick={() => setSelectedTagIds(new Set())}
            >
              <X className="size-2.5" />
              Clear
            </Button>
            <span className="text-xs text-muted-foreground">
              {selectedTagIds.size}/{starterTagLimit}
            </span>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <Input
            value={tagQuery}
            onChange={(event) => setTagQuery(event.target.value)}
            placeholder="Filter tags..."
            className="h-8 rounded-md bg-background/44 text-sm"
          />
          <select
            value={newTagKind}
            onChange={(event) => setNewTagKind(event.target.value as PreferenceKind)}
            className="h-8 rounded-md border border-input bg-input px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {starterTagKinds.map((kind) => (
              <option key={kind} value={kind}>
                {preferenceKindLabels[kind]}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Input
              value={newTagLabel}
              onChange={(event) => setNewTagLabel(event.target.value)}
              placeholder="New tag"
              className="h-8 rounded-md bg-background/44 text-sm md:w-28"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                newTagLabel.trim().length < 2 ||
                selectedTagIds.size >= starterTagLimit ||
                createTagMutation.isPending
              }
              onClick={() => createTagMutation.mutate()}
              className="h-8"
            >
              {createTagMutation.isPending ? (
                <LoaderCircle className="size-3 animate-spin" />
              ) : (
                <Plus className="size-3" />
              )}
              Tag
            </Button>
          </div>
        </div>

        <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
          {filteredTags.map((tag) => {
            const isSelected = selectedTagIds.has(tag.id);

            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-muted/18 text-foreground hover:border-foreground/25 hover:bg-muted/45",
                )}
              >
                <span className="truncate">{tag.label}</span>
                {isSelected ? <Check className="size-3" /> : null}
              </button>
            );
          })}
        </div>

        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-border/24 pt-2">
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                asChild
                variant="outline"
                className="border-border/48 bg-background/34"
              >
                <button type="button" onClick={() => toggleTag(tag.id)}>
                {tag.label}
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
      </section>

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
                    disabled={addMutation.isPending}
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
                    {alreadyAdded ? "Update" : "Add"}
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
              const tags = track.starter_track_tags ?? [];

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
                    {tags.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {tags.slice(0, 3).flatMap((tag) =>
                          tag.preference_tags ? (
                            <Badge
                              key={tag.tag_id}
                              variant="outline"
                              className="h-4 border-border/42 px-1.5 text-[0.56rem] text-muted-foreground"
                            >
                              {tag.preference_tags.label}
                            </Badge>
                          ) : [],
                        )}
                        {tags.length > 3 ? (
                          <Badge
                            variant="outline"
                            className="h-4 border-border/42 px-1.5 text-[0.56rem] text-muted-foreground"
                          >
                            +{tags.length - 3}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant={
                        editingTrack?.id === track.id ? "secondary" : "ghost"
                      }
                      size="icon-sm"
                      onClick={() => startEditing(track)}
                      title="Edit starter pick"
                    >
                      <Pencil className="size-3" />
                      <span className="sr-only">Edit starter pick</span>
                    </Button>
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
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
