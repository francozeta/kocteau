"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Archive,
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  StarterCurateIcon,
  StarterFilterIcon,
  Tags,
  X,
} from "@/components/ui/icons";
import { toast } from "sonner";
import EntityCoverImage from "@/components/entity-cover-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDeezerSearch } from "@/hooks/use-deezer-search";
import { useKocteauSearch } from "@/hooks/use-kocteau-search";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  preferenceKindDescriptions,
  preferenceKindLabels,
  preferenceKindOrder,
  type PreferenceKind,
} from "@/lib/taste";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/queries/http";
import {
  starterCuratorTracksInfiniteQueryOptions,
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
const starterTagLimit = 12;
const starterCatalogPageSize = 30;
const starterTagKinds = preferenceKindOrder;
const starterTagKindSet = new Set<PreferenceKind>(starterTagKinds);
const requiredEditorialKinds = ["era", "format"] as const satisfies readonly PreferenceKind[];

type CatalogFilter = "all" | "needs-signals" | "missing-context" | "ready" | "featured";
type StudioSearchMode = "search" | "scout";

const catalogFilters = [
  { value: "all", label: "All" },
  { value: "needs-signals", label: "No signals" },
  { value: "missing-context", label: "Needs context" },
  { value: "ready", label: "Ready" },
  { value: "featured", label: "Featured" },
] as const satisfies readonly { value: CatalogFilter; label: string }[];

const studioSearchModes = [
  { value: "search", label: "Search" },
  { value: "scout", label: "Scout" },
] as const satisfies readonly { value: StudioSearchMode; label: string }[];

type TagCoverage = {
  tag: StarterPreferenceTag;
  trackCount: number;
};

function getTagKindLabel(kind: string) {
  return preferenceKindLabels[kind as PreferenceKind] ?? kind;
}

function groupTagsByKind(tags: StarterPreferenceTag[]) {
  const groups = new Map<PreferenceKind, StarterPreferenceTag[]>();

  tags.forEach((tag) => {
    const current = groups.get(tag.kind) ?? [];
    current.push(tag);
    groups.set(tag.kind, current);
  });

  const orderedKinds = [
    ...starterTagKinds,
    ...Array.from(groups.keys()).filter((kind) => !starterTagKindSet.has(kind)),
  ];

  return orderedKinds.flatMap((kind) => {
    const groupedTags = groups.get(kind) ?? [];

    return groupedTags.length
      ? [
          {
            kind,
            label: getTagKindLabel(kind),
            tags: groupedTags,
          },
        ]
      : [];
  });
}

function normalizeTagLabel(label: string) {
  return label.trim().toLowerCase();
}

function getTrackPreferenceTags(track: StarterTrackWithTags) {
  return (track.starter_track_tags ?? []).flatMap((tag) =>
    tag.preference_tags ? [tag.preference_tags] : [],
  );
}

function getMissingEditorialKindsFromTags(tags: StarterPreferenceTag[]) {
  const trackKinds = new Set(tags.map((tag) => tag.kind));

  return requiredEditorialKinds.filter((kind) => !trackKinds.has(kind));
}

function getMissingEditorialKinds(track: StarterTrackWithTags) {
  return getMissingEditorialKindsFromTags(getTrackPreferenceTags(track));
}

function getCatalogSearchText(track: StarterTrackWithTags) {
  const tags = getTrackPreferenceTags(track);

  return [
    track.title,
    track.artist_name,
    track.prompt,
    track.editorial_note,
    getTrackStatus(track),
    ...tags.map((tag) => tag.label),
    ...tags.map((tag) => preferenceKindLabels[tag.kind]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getTrackStatus(track: StarterTrackWithTags) {
  const tags = getTrackPreferenceTags(track);
  const missingKinds = getMissingEditorialKindsFromTags(tags);

  if (tags.length === 0) {
    return "No signals";
  }

  if (missingKinds.length > 0) {
    return "Needs context";
  }

  return "Ready";
}

function getStarterCatalogColumnClassName(columnId: string) {
  switch (columnId) {
    case "track":
      return "min-w-0";
    case "artist":
      return "hidden min-w-0 lg:block";
    case "status":
      return "hidden lg:flex";
    case "signals":
      return "hidden min-w-0 lg:block";
    case "context":
      return "hidden min-w-0 xl:block";
    case "action":
      return "flex justify-end";
    default:
      return "";
  }
}

export default function StarterStudioClient() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [studioSearchMode, setStudioSearchMode] = useState<StudioSearchMode>("search");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [editorialNote, setEditorialNote] = useState("");
  const [featured, setFeatured] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(() => new Set());
  const [signalSearchByKind, setSignalSearchByKind] =
    useState<Partial<Record<PreferenceKind, string>>>({});
  const [activeSignalKind, setActiveSignalKind] =
    useState<PreferenceKind | null>(null);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagKind, setNewTagKind] = useState<PreferenceKind>("mood");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [newTagFeatured, setNewTagFeatured] = useState(true);
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [curationOpen, setCurationOpen] = useState(false);
  const [signalPanelOpen, setSignalPanelOpen] = useState(false);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<StarterPreferenceTag | null>(null);
  const [selectedDraftTrack, setSelectedDraftTrack] =
    useState<StarterDraftTrack | null>(null);
  const [editingTrack, setEditingTrack] =
    useState<StarterTrackWithTags | null>(null);
  const normalizedQuery = query.trim();
  const starterTracksQuery = useInfiniteQuery(
    starterCuratorTracksInfiniteQueryOptions({ limit: starterCatalogPageSize }),
  );
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = starterTracksQuery;

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const {
    data: coreSearchResults,
    isFetching: coreSearchFetching,
    error: coreSearchError,
    refetch: retryCoreSearch,
  } = useKocteauSearch({
    query,
    type: "track",
    enabled: studioSearchMode === "search",
  });
  const {
    data: scoutResults,
    isFetching: scoutFetching,
    error: scoutError,
    refetch: retryScoutSearch,
  } = useDeezerSearch({
    query,
    type: "track",
    enabled: studioSearchMode === "scout",
  });
  const starterTracks: StarterTrackWithTags[] = useMemo(
    () => starterTracksQuery.data?.pages.flatMap((page) => page.tracks) ?? [],
    [starterTracksQuery.data],
  );
  const availableTags = useMemo(
    () => starterTracksQuery.data?.pages[0]?.tags ?? [],
    [starterTracksQuery.data],
  );
  const existingProviderIds = useMemo(
    () => new Set(starterTracks.map((track) => track.provider_id)),
    [starterTracks],
  );
  const activeSearchResults =
    studioSearchMode === "search" ? coreSearchResults ?? [] : scoutResults ?? [];
  const activeSearchFetching =
    studioSearchMode === "search" ? coreSearchFetching : scoutFetching;
  const activeSearchError =
    studioSearchMode === "search" ? coreSearchError : scoutError;
  const retryActiveSearch =
    studioSearchMode === "search" ? retryCoreSearch : retryScoutSearch;
  const activeCatalogFilter =
    catalogFilters.find((filter) => filter.value === catalogFilter) ?? catalogFilters[0];
  const activeSearchMode =
    studioSearchModes.find((mode) => mode.value === studioSearchMode) ?? studioSearchModes[0];
  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIds.has(tag.id)),
    [availableTags, selectedTagIds],
  );
  const tagsByKind = useMemo(() => {
    const groups = new Map<PreferenceKind, StarterPreferenceTag[]>();

    availableTags.forEach((tag) => {
      groups.set(tag.kind, [...(groups.get(tag.kind) ?? []), tag]);
    });

    return groups;
  }, [availableTags]);
  const selectedTagsByKind = useMemo(() => {
    const groups = new Map<PreferenceKind, StarterPreferenceTag[]>();

    selectedTags.forEach((tag) => {
      groups.set(tag.kind, [...(groups.get(tag.kind) ?? []), tag]);
    });

    return groups;
  }, [selectedTags]);
  const tagCoverageById = useMemo(() => {
    const coverage = new Map<string, number>();

    starterTracks.forEach((track) => {
      const uniqueTagIds = new Set(
        (track.starter_track_tags ?? []).map((tag) => tag.tag_id),
      );

      uniqueTagIds.forEach((tagId) => {
        coverage.set(tagId, (coverage.get(tagId) ?? 0) + 1);
      });
    });

    return coverage;
  }, [starterTracks]);
  const tagCoverage = useMemo<TagCoverage[]>(
    () =>
      availableTags.map((tag) => ({
        tag,
        trackCount: tagCoverageById.get(tag.id) ?? 0,
      })),
    [availableTags, tagCoverageById],
  );
  const coverageByTagId = useMemo(
    () => new Map(tagCoverage.map((item) => [item.tag.id, item.trackCount])),
    [tagCoverage],
  );
  const filteredStarterTracks = useMemo(
    () =>
      starterTracks.filter((track) => {
        const tags = getTrackPreferenceTags(track);
        const missingKinds = getMissingEditorialKindsFromTags(tags);
        const matchesSearch =
          studioSearchMode !== "search" ||
          normalizedQuery.length < 2 ||
          getCatalogSearchText(track).includes(normalizedQuery.toLowerCase());

        if (!matchesSearch) {
          return false;
        }

        switch (catalogFilter) {
          case "needs-signals":
            return tags.length === 0;
          case "missing-context":
            return tags.length > 0 && missingKinds.length > 0;
          case "ready":
            return tags.length > 0 && missingKinds.length === 0;
          case "featured":
            return track.is_featured;
          case "all":
          default:
            return true;
        }
      }),
    [catalogFilter, normalizedQuery, starterTracks, studioSearchMode],
  );

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) => {
      const next = new Set(current);

      if (next.has(tagId)) {
        next.delete(tagId);
        return next;
      }

      if (next.size >= starterTagLimit) {
        toast.error(`Choose ${starterTagLimit} starter signals or fewer.`);
        return current;
      }

      next.add(tagId);
      return next;
    });
  }

  const resetDraft = useCallback(() => {
    setCurationOpen(false);
    setEditingTrack(null);
    setSelectedDraftTrack(null);
    setPrompt(defaultPrompt);
    setEditorialNote("");
    setFeatured(true);
    setSelectedTagIds(new Set());
    setSignalSearchByKind({});
    setActiveSignalKind(null);
    setConfirmArchiveId(null);
  }, []);

  function resetTagDraft() {
    setEditingTag(null);
    setNewTagLabel("");
    setNewTagKind("mood");
    setNewTagDescription("");
    setNewTagFeatured(true);
  }

  const startEditing = useCallback((track: StarterTrackWithTags) => {
    setSelectedDraftTrack(null);
    setEditingTrack(track);
    setPrompt(track.prompt ?? defaultPrompt);
    setEditorialNote(track.editorial_note ?? "");
    setFeatured(track.is_featured);
    setSelectedTagIds(
      new Set((track.starter_track_tags ?? []).map((tag) => tag.tag_id)),
    );
    setSignalSearchByKind({});
    setActiveSignalKind(null);
    setConfirmArchiveId(null);
    setCurationOpen(true);
  }, []);

  const selectSearchTrack = useCallback((track: StarterDraftTrack) => {
    const existingTrack = starterTracks.find(
      (starterTrack) => starterTrack.provider_id === track.provider_id,
    );

    if (existingTrack) {
      startEditing(existingTrack);
      return;
    }

    setEditingTrack(null);
    setSelectedDraftTrack(track);
    setPrompt(defaultPrompt);
    setEditorialNote("");
    setFeatured(true);
    setSelectedTagIds(new Set());
    setSignalSearchByKind({});
    setActiveSignalKind(null);
    setConfirmArchiveId(null);
    setCurationOpen(true);
  }, [startEditing, starterTracks]);

  function startEditingTag(tag: StarterPreferenceTag) {
    setEditingTag(tag);
    setNewTagLabel(tag.label);
    setNewTagKind(tag.kind);
    setNewTagDescription(tag.description ?? "");
    setNewTagFeatured(tag.is_featured);
    setSignalPanelOpen(true);
  }

  const addMutation = useMutation({
    mutationFn: (track: StarterDraftTrack) => {
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
          editorial_note: editorialNote || null,
          is_featured: featured,
          is_active: true,
          tag_ids: tagIds,
          collection_slug: "starter-picks",
        }),
      });
    },
    onSuccess: (_payload, track) => {
      toast.success(`${track.title} saved to Starter picks.`);
      if (
        editingTrack?.provider_id === track.provider_id ||
        selectedDraftTrack?.provider_id === track.provider_id
      ) {
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
    onSuccess: (_payload, id) => {
      toast.success("Starter pick archived.");
      setConfirmArchiveId(null);
      if (editingTrack?.id === id) {
        resetDraft();
      }
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
          description: newTagDescription || null,
          is_featured: newTagFeatured,
        }),
    }),
    onSuccess: (payload) => {
      toast.success(`${payload.tag.label} created.`);
      setSelectedTagIds((current) => {
        if (!curationOpen || (!editingTrack && !selectedDraftTrack) || current.size >= starterTagLimit) {
          return current;
        }

        return new Set(current).add(payload.tag.id);
      });
      resetTagDraft();
      setActiveSignalKind(payload.tag.kind);
      setSignalSearchByKind((current) => ({
        ...current,
        [payload.tag.kind]: "",
      }));
      setSignalPanelOpen(false);
      void queryClient.invalidateQueries({ queryKey: starterKeys.curatorTracks() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const updateTagMutation = useMutation({
    mutationFn: (tag: StarterPreferenceTag) =>
      fetchJson<StarterTagResponse>("/api/starter/tags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: tag.id,
          label: newTagLabel,
          kind: newTagKind,
          description: newTagDescription || null,
          is_featured: newTagFeatured,
        }),
      }),
    onSuccess: (payload) => {
      toast.success(`${payload.tag.label} updated.`);
      resetTagDraft();
      setActiveSignalKind(payload.tag.kind);
      setSignalSearchByKind((current) => ({
        ...current,
        [payload.tag.kind]: "",
      }));
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
  const inspectedTrack = editingTrack ?? selectedDraftTrack;
  const inspectedTags = selectedTags;
  const inspectedMissingKinds = useMemo(
    () => getMissingEditorialKindsFromTags(inspectedTags),
    [inspectedTags],
  );
  const inspectedStatus = inspectedTags.length === 0
    ? "No signals"
    : inspectedMissingKinds.length > 0
      ? "Needs context"
      : "Ready";
  const inspectedIsPending =
    Boolean(inspectedTrack) && pendingProviderId === inspectedTrack?.provider_id;
  const isConfirmingInspectedArchive =
    Boolean(editingTrack) && confirmArchiveId === editingTrack?.id;
  const canCreateTag =
    newTagLabel.trim().length >= 2 &&
    !createTagMutation.isPending &&
    !updateTagMutation.isPending;

  function getFilteredSignalTags(kind: PreferenceKind) {
    const normalizedSignalQuery = (signalSearchByKind[kind] ?? "")
      .trim()
      .toLowerCase();
    const kindTags = tagsByKind.get(kind) ?? [];

    return kindTags
      .filter((tag) => {
        if (!normalizedSignalQuery) {
          return tag.is_featured || selectedTagIds.has(tag.id);
        }

        return `${tag.label} ${tag.slug} ${tag.description ?? ""}`
          .toLowerCase()
          .includes(normalizedSignalQuery);
      })
      .slice(0, 12);
  }

  function handleSaveTag() {
    const normalizedNewTag = normalizeTagLabel(newTagLabel);

    if (!normalizedNewTag) {
      return;
    }

    const existingTag = availableTags.find(
      (tag) =>
        tag.id !== editingTag?.id &&
        (normalizeTagLabel(tag.label) === normalizedNewTag ||
          normalizeTagLabel(tag.slug) === normalizedNewTag),
    );

    if (existingTag) {
      if (!editingTag) {
        setSelectedTagIds((current) => {
          if (!curationOpen || (!editingTrack && !selectedDraftTrack) || current.size >= starterTagLimit) {
            return current;
          }

          return new Set(current).add(existingTag.id);
        });
        resetTagDraft();
        setActiveSignalKind(existingTag.kind);
        setSignalSearchByKind((current) => ({
          ...current,
          [existingTag.kind]: "",
        }));
      } else {
        toast.error("A tag with that name already exists.");
      }
      return;
    }

    if (editingTag && canCreateTag) {
      updateTagMutation.mutate(editingTag);
      return;
    }

    if (!editingTag && canCreateTag) {
      createTagMutation.mutate();
    }
  }

  const focusTagKind = useCallback((kind: PreferenceKind) => {
    setActiveSignalKind(kind);
    setSignalSearchByKind((current) => ({
      ...current,
      [kind]: "",
    }));
  }, []);

  const handleArchive = useCallback((track: StarterTrackWithTags) => {
    if (confirmArchiveId === track.id) {
      archiveMutation.mutate(track.id);
      return;
    }

    setConfirmArchiveId(track.id);
  }, [archiveMutation, confirmArchiveId]);

  const handleCurationOpenChange = useCallback((open: boolean) => {
    setCurationOpen(open);

    if (!open) {
      setConfirmArchiveId(null);
    }
  }, []);

  const curationPanelContent = (
    <div className="space-y-4">
      {inspectedTrack ? (
        <>
          <section className="space-y-3">
            <EntityCoverImage
              src={inspectedTrack.cover_url}
              alt={`${inspectedTrack.title} cover`}
              sizes="256px"
              className="aspect-square w-full rounded-[0.85rem] border border-border/20 bg-muted/20 sm:hidden"
              iconClassName="size-8"
            />
            <div className="grid gap-3 sm:grid-cols-[5.25rem_minmax(0,1fr)]">
              <EntityCoverImage
                src={inspectedTrack.cover_url}
                alt={`${inspectedTrack.title} cover`}
                sizes="84px"
                className="hidden aspect-square w-full rounded-[0.72rem] border border-border/20 bg-muted/20 sm:block"
                iconClassName="size-6"
              />
              <div className="min-w-0 space-y-2">
                <p className="text-[0.66rem] font-medium uppercase text-muted-foreground">
                  {editingTrack ? "Editing starter pick" : "Selected from Deezer"}
                </p>
                <h2 className="text-pretty font-serif text-2xl font-semibold leading-7 text-foreground">
                  {inspectedTrack.title}
                </h2>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="truncate text-sm text-muted-foreground">
                    {inspectedTrack.artist_name ?? "Unknown artist"}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "inline-flex h-5 shrink-0 items-center rounded-full border-border/34 px-2 text-[0.62rem] leading-none",
                      inspectedStatus === "Ready"
                        ? "text-foreground"
                        : "border-amber-500/22 bg-amber-500/7 text-amber-100/78",
                    )}
                  >
                    {inspectedStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border/18 bg-card/12 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Tags className="size-4 text-muted-foreground" />
                Signals
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTagIds.size > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTagIds(new Set())}
                    className="h-7 rounded-full px-2.5 text-[0.68rem]"
                  >
                    Clear signals
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetTagDraft();
                    setSignalPanelOpen(true);
                  }}
                  className="h-7 rounded-full border-border/24 px-2.5 text-[0.68rem]"
                >
                  <Plus className="size-3" />
                  New signal
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {starterTagKinds.map((kind) => {
                const kindLabel = preferenceKindLabels[kind];
                const kindDescription = preferenceKindDescriptions[kind];
                const selectedKindTags = selectedTagsByKind.get(kind) ?? [];
                const filteredKindTags = getFilteredSignalTags(kind);
                const signalSearch = signalSearchByKind[kind] ?? "";
                const isActive = activeSignalKind === kind;
                const isMissing = inspectedMissingKinds.includes(kind);

                return (
                  <div
                    key={kind}
                    className={cn(
                      "grid gap-2 rounded-lg border border-border/16 bg-background/18 p-2.5 sm:grid-cols-[5.25rem_minmax(0,1fr)] sm:items-start",
                      isActive && "border-foreground/22 bg-foreground/[0.025]",
                      isMissing && "border-amber-500/18 bg-amber-500/[0.035]",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-[0.62rem] font-medium uppercase leading-5 text-muted-foreground">
                        {kindLabel}
                      </p>
                      <p className="hidden truncate text-[0.62rem] text-muted-foreground/66 sm:block">
                        {kindDescription}
                      </p>
                    </div>

                    <Popover
                      onOpenChange={(open) => {
                        if (open) {
                          setActiveSignalKind(kind);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-border/20 bg-background/28 px-2.5 py-1.5 text-left transition-colors hover:border-foreground/24 hover:bg-background/36 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                            selectedKindTags.length === 0 && "text-muted-foreground",
                          )}
                        >
                          <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                            {selectedKindTags.length > 0 ? (
                              selectedKindTags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex h-5 max-w-full items-center rounded-full border border-foreground/24 bg-foreground/[0.055] px-2 text-[0.68rem] font-medium leading-none text-foreground"
                                >
                                  <span className="truncate">{tag.label}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs">
                                Add {kindLabel.toLowerCase()}
                              </span>
                            )}
                          </span>
                          <Search className="size-3.5 shrink-0 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-[min(22rem,calc(100vw-2rem))] gap-2 border-border/24 bg-[var(--kocteau-surface)] p-2 shadow-none"
                      >
                        <div className="relative">
                          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={signalSearch}
                            onChange={(event) =>
                              setSignalSearchByKind((current) => ({
                                ...current,
                                [kind]: event.target.value,
                              }))
                            }
                            placeholder={`Search ${kindLabel.toLowerCase()}...`}
                            className="h-8 rounded-full bg-background/42 pr-3 pl-8 text-xs"
                          />
                        </div>

                        <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                          {filteredKindTags.map((tag) => {
                            const isSelected = selectedTagIds.has(tag.id);
                            const coverageCount = coverageByTagId.get(tag.id) ?? 0;

                            return (
                              <div
                                key={tag.id}
                                className={cn(
                                  "flex min-h-8 items-center rounded-lg border border-transparent text-xs transition-colors",
                                  isSelected
                                    ? "bg-foreground text-background"
                                    : "hover:border-border/24 hover:bg-foreground/[0.045]",
                                )}
                              >
                                <button
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() => toggleTag(tag.id)}
                                  className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                                >
                                  <span className="min-w-0 flex-1 truncate font-medium">
                                    {tag.label}
                                  </span>
                                  <span
                                    className={cn(
                                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.56rem] tabular-nums leading-none",
                                      isSelected
                                        ? "bg-background/14 text-background"
                                        : coverageCount > 0
                                          ? "bg-foreground/[0.06] text-muted-foreground"
                                          : "bg-amber-500/10 text-amber-100/78",
                                    )}
                                  >
                                    {coverageCount}
                                  </span>
                                  {isSelected ? <Check className="size-3" /> : null}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditingTag(tag)}
                                  className={cn(
                                    "grid h-8 w-8 place-items-center border-l transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                                    isSelected
                                      ? "border-background/18 text-background/76 hover:text-background"
                                      : "border-border/22 text-muted-foreground hover:text-foreground",
                                  )}
                                  aria-label={`Edit ${tag.label}`}
                                >
                                  <Pencil className="size-3" />
                                </button>
                              </div>
                            );
                          })}

                          {filteredKindTags.length === 0 ? (
                            <p className="rounded-lg border border-border/22 bg-background/22 px-3 py-5 text-center text-xs text-muted-foreground">
                              No matching signals.
                            </p>
                          ) : null}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border/18 bg-card/12 p-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Context</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Keep the cue short and useful for first listens.
              </p>
            </div>

            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Editorial prompt"
              className="h-9 rounded-lg bg-background/42 text-sm"
            />

            <Textarea
              value={editorialNote}
              onChange={(event) => setEditorialNote(event.target.value)}
              placeholder="Why this pick belongs here"
              maxLength={240}
              className="min-h-20 resize-none rounded-lg bg-background/42 text-sm"
            />

            <div className="flex items-center gap-3 rounded-lg border border-border/22 bg-background/22 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">Featured</p>
                <p className="truncate text-xs text-muted-foreground">
                  Prioritize this pick
                </p>
              </div>
              <Switch
                checked={featured}
                onCheckedChange={setFeatured}
                aria-label="Prioritize this starter pick"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <Button
                type="button"
                size="sm"
                disabled={addMutation.isPending}
                onClick={() => addMutation.mutate(inspectedTrack)}
                className="h-9"
              >
                {inspectedIsPending ? (
                  <LoaderCircle className="size-3 animate-spin" />
                ) : editingTrack ? (
                  <Check className="size-3" />
                ) : (
                  <Plus className="size-3" />
                )}
                {editingTrack ? "Update pick" : "Add pick"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={addMutation.isPending}
                onClick={resetDraft}
                className="h-9"
              >
                <X className="size-3" />
                Clear
              </Button>
              {editingTrack ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={archiveMutation.isPending}
                  onClick={() => handleArchive(editingTrack)}
                  className={cn(
                    "h-9",
                    isConfirmingInspectedArchive &&
                      "border border-amber-500/24 bg-amber-500/7 text-amber-100/86 hover:bg-amber-500/10",
                  )}
                >
                  {pendingArchiveId === editingTrack.id ? (
                    <LoaderCircle className="size-3 animate-spin" />
                  ) : (
                    <Archive className="size-3" />
                  )}
                  {isConfirmingInspectedArchive ? "Confirm archive" : "Archive"}
                </Button>
              ) : null}
            </div>
          </section>
        </>
      ) : (
        <div className="space-y-3 py-2">
          <div className="aspect-square rounded-[0.85rem] border border-dashed border-border/28 bg-background/20" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No song selected</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Select a Deezer result or an existing starter pick to inspect cover, signals, and missing context.
            </p>
          </div>
        </div>
      )}
    </div>
  );
  const curationPanelTitle = editingTrack ? "Edit starter pick" : "Add starter pick";
  const curationPanelDescription =
    "Choose signals, add context, and decide whether this track belongs in starter picks.";
  const curationPanelOpen = curationOpen && Boolean(inspectedTrack);
  const signalPanelContent = (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {editingTag ? "Edit signal" : "Create signal"}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          Add moods, scenes, eras, styles, or formats for starter curation.
        </p>
      </div>

      <Input
        value={newTagLabel}
        onChange={(event) => setNewTagLabel(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSaveTag();
          }
        }}
        placeholder="Signal name"
        className="h-10 rounded-lg bg-background/44 text-sm"
      />

      <div className="grid grid-cols-2 gap-1.5">
        {starterTagKinds.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={newTagKind === kind}
            onClick={() => setNewTagKind(kind)}
            className={cn(
              "h-9 rounded-md border px-2.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              newTagKind === kind
                ? "border-foreground/32 bg-foreground/[0.075] text-foreground"
                : "border-border/32 bg-background/24 text-muted-foreground hover:text-foreground",
            )}
          >
            {preferenceKindLabels[kind]}
          </button>
        ))}
      </div>

      <Input
        value={newTagDescription}
        onChange={(event) => setNewTagDescription(event.target.value)}
        placeholder="Short note"
        className="h-10 rounded-lg bg-background/44 text-sm"
      />

      <div className="flex items-center gap-3 rounded-lg border border-border/20 bg-card/18 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">Featured</p>
          <p className="truncate text-xs text-muted-foreground">
            Show in default signal views
          </p>
        </div>
        <Switch
          checked={newTagFeatured}
          onCheckedChange={setNewTagFeatured}
          aria-label="Feature this signal"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canCreateTag}
        onClick={handleSaveTag}
        className="h-10 w-full"
      >
        {createTagMutation.isPending || updateTagMutation.isPending ? (
          <LoaderCircle className="size-3 animate-spin" />
        ) : editingTag ? (
          <Check className="size-3" />
        ) : (
          <Plus className="size-3" />
        )}
        {editingTag ? "Save signal" : "Create signal"}
      </Button>
    </div>
  );
  const starterCatalogColumns = useMemo<ColumnDef<StarterTrackWithTags>[]>(
    () => [
      {
        id: "track",
        header: "Name",
        cell: ({ row }) => {
          const track = row.original;
          const tags = getTrackPreferenceTags(track);
          const status = getTrackStatus(track);
          const primaryTag = tags[0]?.label ?? status;

          return (
            <button
              type="button"
              onClick={() => startEditing(track)}
              className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-2.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:grid-cols-[2.75rem_minmax(0,1fr)]"
            >
              <EntityCoverImage
                src={track.cover_url}
                alt={`${track.title} cover`}
                sizes="44px"
                className="size-10 rounded-[0.38rem] border border-border/18 bg-muted/20 sm:size-11 sm:rounded-[0.42rem]"
                iconClassName="size-4"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {track.title}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[0.68rem] text-muted-foreground lg:hidden">
                  <span className="truncate">{track.artist_name ?? "Unknown artist"}</span>
                  <span className="size-1 rounded-full bg-muted-foreground/30" />
                  <span className="truncate">{primaryTag}</span>
                </span>
              </span>
            </button>
          );
        },
      },
      {
        id: "artist",
        header: "Artist",
        cell: ({ row }) => {
          const track = row.original;

          return (
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground/88">
                {track.artist_name ?? "Unknown artist"}
              </p>
              <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                {track.is_featured ? "Featured starter" : "Catalog pick"}
              </p>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = getTrackStatus(row.original);

          return (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-1.5 rounded-full bg-muted-foreground/42",
                  status === "Ready" && "bg-foreground/72",
                  status !== "Ready" && "bg-amber-300/70",
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium text-muted-foreground",
                  status === "Ready" && "text-foreground/86",
                  status !== "Ready" && "text-amber-100/78",
                )}
              >
                {status}
              </span>
            </div>
          );
        },
      },
      {
        id: "signals",
        header: "Signals",
        cell: ({ row }) => {
          const tags = getTrackPreferenceTags(row.original);
          const tagRows = groupTagsByKind(tags).slice(0, 3);
          const shownTagCount = tagRows.reduce(
            (sum, group) => sum + Math.min(group.tags.length, 2),
            0,
          );

          if (tagRows.length === 0) {
            return <span className="text-xs text-muted-foreground/70">No signals yet</span>;
          }

          return (
            <div className="flex flex-wrap gap-1.5 overflow-hidden">
              {tagRows.flatMap((group) =>
                group.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={`${group.kind}-${tag.id}`}
                    className="inline-flex h-5 max-w-full items-center gap-1 rounded-full border border-border/18 bg-background/22 px-2 text-[0.66rem] leading-none text-muted-foreground"
                  >
                    {index === 0 ? (
                      <span className="inline-flex h-full items-center text-muted-foreground/66">
                        {group.label}
                      </span>
                    ) : null}
                    <span className="truncate text-foreground/82">{tag.label}</span>
                  </span>
                )),
              )}
              {tags.length > shownTagCount ? (
                <span className="inline-flex h-5 items-center rounded-full border border-border/18 bg-background/20 px-2 text-[0.66rem] leading-none text-muted-foreground">
                  +{tags.length - shownTagCount}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "context",
        header: "Context",
        cell: ({ row }) => {
          const track = row.original;
          const missingKinds = getMissingEditorialKinds(track);
          const primaryContext = track.editorial_note || track.prompt || null;

          if (missingKinds.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {missingKinds.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      startEditing(track);
                      focusTagKind(kind);
                    }}
                    className="rounded-md border border-amber-500/20 bg-amber-500/7 px-2 py-1 text-[0.68rem] font-medium text-amber-100/78 transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    No {getTagKindLabel(kind).toLowerCase()}
                  </button>
                ))}
              </div>
            );
          }

          if (primaryContext) {
            return (
              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                {primaryContext}
              </p>
            );
          }

          return <span className="text-xs text-muted-foreground/70">Ready for rotation</span>;
        },
      },
      {
        id: "action",
        header: "Curate",
        cell: ({ row }) => {
          const track = row.original;
          const isEditing = editingTrack?.id === track.id;

          return (
            <Button
              type="button"
              variant={isEditing ? "secondary" : "ghost"}
              size="sm"
              onClick={() => startEditing(track)}
              className="size-9 rounded-full px-0 text-muted-foreground hover:text-foreground lg:h-8 lg:w-auto lg:rounded-md lg:px-2.5"
              title="Curate starter pick"
              aria-label={`Curate ${track.title}`}
            >
              <StarterCurateIcon className="size-4" />
              <span className="hidden lg:inline">Curate</span>
            </Button>
          );
        },
      },
    ],
    [editingTrack?.id, focusTagKind, startEditing],
  );
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table owns the row model internals for this catalog view.
  const starterCatalogTable = useReactTable({
    data: filteredStarterTracks,
    columns: starterCatalogColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex w-full max-w-none flex-1 flex-col gap-6">
      {isMobile ? (
        <Drawer open={curationPanelOpen} onOpenChange={handleCurationOpenChange}>
          <DrawerContent className="max-h-[94dvh] overflow-hidden rounded-t-[1.05rem] border border-b-0 border-border/24 bg-[var(--kocteau-surface)] p-0 text-foreground before:hidden">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{curationPanelTitle}</DrawerTitle>
              <DrawerDescription>{curationPanelDescription}</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 overflow-y-auto px-4 pt-4 pb-5">
              {curationPanelContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={curationPanelOpen} onOpenChange={handleCurationOpenChange}>
          <DialogContent
            showCloseButton
            className="flex h-[min(90vh,48rem)] w-[min(100vw-1.5rem,54rem)] flex-col overflow-hidden rounded-xl border-border/24 bg-[var(--kocteau-surface)] p-0 text-foreground shadow-none"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{curationPanelTitle}</DialogTitle>
              <DialogDescription>{curationPanelDescription}</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 overflow-y-auto px-5 py-5">
              {curationPanelContent}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isMobile ? (
        <Drawer
          open={signalPanelOpen}
          onOpenChange={(open) => {
            setSignalPanelOpen(open);
            if (!open) {
              resetTagDraft();
            }
          }}
        >
          <DrawerContent className="max-h-[88dvh] overflow-hidden rounded-t-[1.05rem] border border-b-0 border-border/24 bg-[var(--kocteau-surface)] p-0 text-foreground before:hidden">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Create signal</DrawerTitle>
              <DrawerDescription>Create curation vocabulary for starter picks.</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 overflow-y-auto px-4 pt-4 pb-5">
              {signalPanelContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={signalPanelOpen}
          onOpenChange={(open) => {
            setSignalPanelOpen(open);
            if (!open) {
              resetTagDraft();
            }
          }}
        >
          <DialogContent
            showCloseButton
            className="flex w-[min(100vw-1.5rem,28rem)] flex-col overflow-hidden rounded-xl border-border/24 bg-[var(--kocteau-surface)] p-5 text-foreground shadow-none"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Create signal</DialogTitle>
              <DialogDescription>Create curation vocabulary for starter picks.</DialogDescription>
            </DialogHeader>
            {signalPanelContent}
          </DialogContent>
        </Dialog>
      )}

      <header className="sr-only">
        <h1>Starter Studio</h1>
      </header>

      <div className="min-h-0">
        <section className="min-w-0 space-y-5">
          <section className="space-y-3">
            <div className="space-y-2">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={
                      studioSearchMode === "search"
                        ? "Search Kocteau tracks..."
                        : "Scout for starter picks..."
                    }
                    className="h-10 rounded-full border-border/32 bg-foreground/[0.045] pr-10 pl-10 text-sm shadow-none transition-colors placeholder:text-muted-foreground/68 focus-visible:border-foreground/42 focus-visible:bg-foreground/[0.06]"
                  />
                  <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
                    {activeSearchFetching ? (
                      <Spinner className="size-4 text-muted-foreground" />
                    ) : normalizedQuery.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.075] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                        aria-label="Clear search"
                      >
                        <X className="size-3" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="grid h-9 grid-cols-2 rounded-full border border-border/22 bg-background/26 p-1">
                    {studioSearchModes.map((mode) => {
                      const isActive = studioSearchMode === mode.value;

                      return (
                        <button
                          key={mode.value}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => setStudioSearchMode(mode.value)}
                          className={cn(
                            "rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                            isActive
                              ? "bg-foreground/[0.095] text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="relative size-9 rounded-full border border-border/22 bg-background/26 text-muted-foreground hover:text-foreground"
                        aria-label={`Filter starter catalog. Current: ${activeCatalogFilter.label}`}
                        title={`Filter: ${activeCatalogFilter.label}`}
                      >
                        <StarterFilterIcon className="size-4" />
                        {catalogFilter !== "all" ? (
                          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-foreground/72" />
                        ) : null}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 border-border/24 bg-[var(--kocteau-surface)] shadow-none"
                    >
                      <DropdownMenuLabel>View</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={catalogFilter}
                        onValueChange={(value) => setCatalogFilter(value as CatalogFilter)}
                      >
                        {catalogFilters.map((filter) => (
                          <DropdownMenuRadioItem key={filter.value} value={filter.value}>
                            {filter.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[0.68rem]">
                        {activeCatalogFilter.label}
                      </DropdownMenuLabel>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetTagDraft();
                      setSignalPanelOpen(true);
                    }}
                    className="h-9 rounded-full border-border/22 bg-background/26 px-3 text-muted-foreground hover:text-foreground"
                  >
                    <Tags className="size-4" />
                    <span className="hidden sm:inline">Signal</span>
                  </Button>
                </div>
              </div>

              {normalizedQuery.length >= 2 ? (
                <div className="space-y-1.5 rounded-xl border border-border/18 bg-card/12 p-1.5">
                  {activeSearchError ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground">
                      <span className="min-w-0">
                        {activeSearchError.message ||
                          "Search is taking longer than usual."}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={activeSearchFetching}
                        onClick={() => {
                          void retryActiveSearch();
                        }}
                        className="h-7 shrink-0 rounded-full px-2.5 text-[11px]"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : null}

                  {!activeSearchError && !activeSearchFetching && activeSearchResults.length === 0 ? (
                    <p className="px-2.5 py-3 text-sm text-muted-foreground">
                      No tracks found.
                    </p>
                  ) : null}

                  {activeSearchResults.slice(0, 6).map((track) => {
                    const alreadyAdded = existingProviderIds.has(track.provider_id);
                    const isSelected =
                      selectedDraftTrack?.provider_id === track.provider_id ||
                      editingTrack?.provider_id === track.provider_id;
                    const sourceLabel =
                      "source_label" in track ? track.source_label : null;

                    return (
                      <article
                        key={`${activeSearchMode.value}-${track.provider_id}`}
                        className={cn(
                          "grid min-h-[3.75rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-foreground/[0.035]",
                          isSelected && "bg-foreground/[0.055]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => selectSearchTrack(track)}
                          className="grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-2.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                        >
                          <EntityCoverImage
                            src={track.cover_url}
                            alt={`${track.title} cover`}
                            sizes="44px"
                            className="size-10 rounded-[0.42rem] border border-border/18 bg-muted/20"
                            iconClassName="size-4"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {track.title}
                            </span>
                            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="truncate">
                                {track.artist_name ?? "Unknown artist"}
                              </span>
                              {sourceLabel ? (
                                <>
                                  <span className="size-1 rounded-full bg-muted-foreground/30" />
                                  <span className="shrink-0">{sourceLabel}</span>
                                </>
                              ) : null}
                            </span>
                          </span>
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "secondary" : "ghost"}
                          disabled={addMutation.isPending}
                          onClick={() => selectSearchTrack(track)}
                          className="size-9 rounded-full px-0 text-muted-foreground hover:text-foreground sm:h-8 sm:w-auto sm:rounded-md sm:px-2.5"
                          aria-label={
                            alreadyAdded ? `Edit ${track.title}` : `Select ${track.title}`
                          }
                        >
                          {isSelected ? (
                            <Check className="size-3" />
                          ) : alreadyAdded ? (
                            <StarterCurateIcon className="size-4" />
                          ) : (
                            <Plus className="size-3" />
                          )}
                          <span className="hidden sm:inline">
                            {isSelected ? "Selected" : alreadyAdded ? "Edit" : "Select"}
                          </span>
                        </Button>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              {starterCatalogTable.getHeaderGroups().map((headerGroup) => (
                <div
                  key={headerGroup.id}
                  className="sticky top-0 z-20 hidden min-h-9 grid-cols-[minmax(16rem,1.35fr)_minmax(8rem,0.72fr)_7rem_minmax(13rem,1fr)_minmax(10rem,0.78fr)_6.25rem] items-center gap-3 border-y border-border/12 bg-[var(--kocteau-shell)]/96 px-3 text-[0.64rem] font-medium text-muted-foreground backdrop-blur lg:grid"
                >
                  {headerGroup.headers.map((header) => (
                    <div
                      key={header.id}
                      className={cn(
                        getStarterCatalogColumnClassName(header.column.id),
                        header.column.id === "action" && "text-right",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  ))}
                </div>
              ))}

              {starterTracksQuery.isLoading ? (
                <div className="flex min-h-24 items-center justify-center text-muted-foreground">
                  <Spinner className="size-5" />
                </div>
              ) : null}

              {!starterTracksQuery.isLoading && starterTracks.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No starter picks yet.
                </p>
              ) : null}

              {!starterTracksQuery.isLoading &&
              starterTracks.length > 0 &&
              filteredStarterTracks.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No starter picks match this view.
                </p>
              ) : null}

              {starterCatalogTable.getRowModel().rows.map((row, index) => (
                <article
                  key={row.id}
                  className={cn(
                    "grid min-h-[4.25rem] grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-3 rounded-[0.72rem] px-2.5 py-2 transition-colors hover:bg-foreground/[0.035] lg:grid-cols-[minmax(16rem,1.35fr)_minmax(8rem,0.72fr)_7rem_minmax(13rem,1fr)_minmax(10rem,0.78fr)_6.25rem] lg:px-3 lg:py-2.5",
                    index % 2 === 1 && "bg-foreground/[0.014]",
                    row.original.is_featured && "bg-foreground/[0.024]",
                    editingTrack?.id === row.original.id && "bg-foreground/[0.06]",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className={getStarterCatalogColumnClassName(cell.column.id)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </article>
              ))}

              <div
                ref={loadMoreRef}
                className="flex min-h-12 items-center justify-center text-muted-foreground"
              >
                {hasNextPage || isFetchingNextPage ? <Spinner className="size-5" /> : null}
              </div>
            </div>
          </section>
        </section>

      </div>
    </div>
  );
}
