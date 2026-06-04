"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tags,
  X,
} from "@/components/ui/icons";
import { toast } from "sonner";
import EntityCoverImage from "@/components/entity-cover-image";
import { useSecondaryRail } from "@/components/secondary-rail-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDeezerSearch } from "@/hooks/use-deezer-search";
import {
  preferenceKindDescriptions,
  preferenceKindLabels,
  preferenceKindOrder,
  type PreferenceKind,
} from "@/lib/taste";
import type { StarterCandidateSource } from "@/lib/starter/candidates";
import { getEditorialCandidateStatusLabel } from "@/lib/starter/candidate-queue";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/queries/http";
import {
  editorialCandidateQueueQueryOptions,
  starterCandidatesQueryOptions,
  starterCuratorTracksQueryOptions,
  starterKeys,
  type EditorialCandidateRow,
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

type EditorialCandidateResponse = {
  ok: boolean;
  candidate: EditorialCandidateRow;
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
const starterSignalTarget = 6;
const starterTagLimit = 12;
const starterTagKinds = preferenceKindOrder;
const starterTagKindSet = new Set<PreferenceKind>(starterTagKinds);
const requiredEditorialKinds = ["era", "format"] as const satisfies readonly PreferenceKind[];

type CatalogFilter = "all" | "needs-signals" | "missing-context" | "ready" | "featured";

const catalogFilters = [
  { value: "all", label: "All" },
  { value: "needs-signals", label: "No signals" },
  { value: "missing-context", label: "Needs context" },
  { value: "ready", label: "Ready" },
  { value: "featured", label: "Featured" },
] as const satisfies readonly { value: CatalogFilter; label: string }[];

const candidateModes = [
  { value: "related-seed", label: "Related" },
  { value: "deep-cut", label: "Deep cuts" },
] as const satisfies readonly { value: StarterCandidateSource; label: string }[];

const candidateTierLabels: Record<string, string> = {
  emerging: "Emerging",
  undercovered: "Undercovered",
  familiar: "Familiar",
  "deep-cut": "Deep cut",
  obvious: "Obvious",
};

type TagCoverage = {
  tag: StarterPreferenceTag;
  trackCount: number;
};

type KindCoverage = {
  kind: PreferenceKind;
  label: string;
  tagCount: number;
  coveredTagCount: number;
  uncoveredTagCount: number;
};

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

function formatSignalCount(count: number) {
  if (count >= starterSignalTarget) {
    return `${count} signal${count === 1 ? "" : "s"}`;
  }

  return `${count}/${starterSignalTarget}`;
}

function formatSelectedSignalCount(count: number) {
  if (count >= starterSignalTarget) {
    return `${count} selected`;
  }

  return `${count}/${starterSignalTarget} selected`;
}

export default function StarterStudioClient() {
  const queryClient = useQueryClient();
  const { setContent: setSecondaryRailContent } = useSecondaryRail();
  const [query, setQuery] = useState("");
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateMode, setCandidateMode] =
    useState<StarterCandidateSource>("related-seed");
  const [dismissedCandidateKeys, setDismissedCandidateKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [editorialNote, setEditorialNote] = useState("");
  const [featured, setFeatured] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(() => new Set());
  const [tagQuery, setTagQuery] = useState("");
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagKind, setNewTagKind] = useState<PreferenceKind>("mood");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [newTagFeatured, setNewTagFeatured] = useState(true);
  const [tagKindFilter, setTagKindFilter] = useState<PreferenceKind | "all">("all");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<StarterPreferenceTag | null>(null);
  const [selectedDraftTrack, setSelectedDraftTrack] =
    useState<StarterDraftTrack | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] =
    useState<StarterTrackWithTags | null>(null);
  const normalizedQuery = query.trim();
  const normalizedCandidateQuery = candidateQuery.trim();
  const candidateDismissalScope = `${candidateMode}:${normalizedCandidateQuery.toLowerCase()}`;
  const starterTracksQuery = useQuery(starterCuratorTracksQueryOptions());
  const candidateTracksQuery = useQuery({
    ...starterCandidatesQueryOptions({
      mode: candidateMode,
      query: normalizedCandidateQuery,
      limit: 8,
    }),
    enabled: normalizedCandidateQuery.length >= 2,
  });
  const editorialCandidateQueueQuery = useQuery(
    editorialCandidateQueueQueryOptions({
      status: "queued",
      limit: 12,
    }),
  );
  const {
    data: searchResults,
    isFetching: searchFetching,
    error: searchError,
    refetch: retrySearch,
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
  const editorialCandidateQueue = useMemo(
    () => editorialCandidateQueueQuery.data?.candidates ?? [],
    [editorialCandidateQueueQuery.data],
  );
  const queuedCandidateProviderIds = useMemo(
    () =>
      new Set(
        editorialCandidateQueue.map((candidate) => candidate.provider_id),
      ),
    [editorialCandidateQueue],
  );
  const candidateResults = useMemo(
    () =>
      (candidateTracksQuery.data?.tracks ?? []).filter(
        (track) =>
          !dismissedCandidateKeys.has(`${candidateDismissalScope}:${track.provider_id}`) &&
          !existingProviderIds.has(track.provider_id),
      ),
    [
      candidateDismissalScope,
      candidateTracksQuery.data,
      dismissedCandidateKeys,
      existingProviderIds,
    ],
  );
  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIds.has(tag.id)),
    [availableTags, selectedTagIds],
  );
  const filteredTags = useMemo(() => {
    const normalizedTagQuery = tagQuery.trim().toLowerCase();

    return availableTags
      .filter((tag) => {
        if (tagKindFilter !== "all" && tag.kind !== tagKindFilter) {
          return false;
        }

        if (!normalizedTagQuery) {
          return tag.is_featured;
        }

        return `${tag.label} ${tag.slug} ${tag.kind}`
          .toLowerCase()
          .includes(normalizedTagQuery);
      })
      .slice(0, 36);
  }, [availableTags, tagKindFilter, tagQuery]);
  const filteredTagGroups = useMemo(
    () => groupTagsByKind(filteredTags),
    [filteredTags],
  );
  const selectedTagGroups = useMemo(
    () => groupTagsByKind(selectedTags),
    [selectedTags],
  );
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
  const kindCoverage = useMemo<KindCoverage[]>(
    () =>
      starterTagKinds.map((kind) => {
        const kindTags = tagCoverage.filter((item) => item.tag.kind === kind);
        const coveredTagCount = kindTags.filter((item) => item.trackCount > 0).length;

        return {
          kind,
          label: preferenceKindLabels[kind],
          tagCount: kindTags.length,
          coveredTagCount,
          uncoveredTagCount: Math.max(kindTags.length - coveredTagCount, 0),
        };
      }),
    [tagCoverage],
  );
  const untaggedStarterCount = useMemo(
    () => starterTracks.filter((track) => (track.starter_track_tags ?? []).length === 0).length,
    [starterTracks],
  );
  const filteredStarterTracks = useMemo(
    () =>
      starterTracks.filter((track) => {
        const tags = getTrackPreferenceTags(track);
        const missingKinds = getMissingEditorialKindsFromTags(tags);

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
    [catalogFilter, starterTracks],
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
    setEditingTrack(null);
    setSelectedDraftTrack(null);
    setSelectedCandidateId(null);
    setPrompt(defaultPrompt);
    setEditorialNote("");
    setFeatured(true);
    setSelectedTagIds(new Set());
    setTagQuery("");
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
    setSelectedCandidateId(null);
    setEditingTrack(track);
    setPrompt(track.prompt ?? defaultPrompt);
    setEditorialNote(track.editorial_note ?? "");
    setFeatured(track.is_featured);
    setSelectedTagIds(
      new Set((track.starter_track_tags ?? []).map((tag) => tag.tag_id)),
    );
    setTagQuery("");
    setConfirmArchiveId(null);
  }, []);

  const selectSearchTrack = useCallback((
    track: StarterDraftTrack,
    candidateId: string | null = null,
  ) => {
    const existingTrack = starterTracks.find(
      (starterTrack) => starterTrack.provider_id === track.provider_id,
    );

    if (existingTrack) {
      setSelectedCandidateId(null);
      startEditing(existingTrack);
      return;
    }

    setEditingTrack(null);
    setSelectedDraftTrack(track);
    setSelectedCandidateId(candidateId);
    setPrompt(defaultPrompt);
    setEditorialNote("");
    setFeatured(true);
    setSelectedTagIds(new Set());
    setTagQuery("");
    setConfirmArchiveId(null);
  }, [startEditing, starterTracks]);

  function startEditingTag(tag: StarterPreferenceTag) {
    setEditingTag(tag);
    setNewTagLabel(tag.label);
    setNewTagKind(tag.kind);
    setNewTagDescription(tag.description ?? "");
    setNewTagFeatured(tag.is_featured);
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
    onSuccess: (payload, track) => {
      toast.success(`${track.title} saved to Starter picks.`);
      const approvedCandidateId = selectedCandidateId;

      if (approvedCandidateId) {
        void fetchJson<EditorialCandidateResponse>("/api/starter/candidate-queue", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: approvedCandidateId,
            status: "approved",
            starter_track_id: payload.track.id,
            decision_note: "Approved into starter picks.",
          }),
        })
          .then(() =>
            queryClient.invalidateQueries({
              queryKey: starterKeys.candidateQueue("queued", 12),
            }),
          )
          .catch((error) => {
            toast.error(error.message);
          });
      }

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

  const queueCandidateMutation = useMutation({
    mutationFn: (candidate: StarterDraftTrack & {
      source: string;
      source_label: string;
      seed_label: string | null;
      tier: string;
      reason: string | null;
      score: number;
    }) =>
      fetchJson<EditorialCandidateResponse>("/api/starter/candidate-queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: candidate.provider,
          provider_id: candidate.provider_id,
          type: candidate.type,
          title: candidate.title,
          artist_name: candidate.artist_name,
          cover_url: candidate.cover_url,
          deezer_url: candidate.deezer_url,
          source: candidate.source,
          source_label: candidate.source_label,
          seed_label: candidate.seed_label,
          tier: candidate.tier,
          reason: candidate.reason,
          score: candidate.score,
          metadata: {
            mode: candidateMode,
            seed: normalizedCandidateQuery,
          },
        }),
      }),
    onSuccess: (payload) => {
      toast.success(`${payload.candidate.title} saved to the queue.`);
      void queryClient.invalidateQueries({
        queryKey: starterKeys.candidateQueue("queued", 12),
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const decideCandidateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      decision_note,
    }: {
      id: string;
      status: "queued" | "approved" | "dismissed" | "archived";
      decision_note?: string;
    }) =>
      fetchJson<EditorialCandidateResponse>("/api/starter/candidate-queue", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
          decision_note,
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: starterKeys.candidateQueue("queued", 12),
      });
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
      setSelectedTagIds((current) => new Set(current).add(payload.tag.id));
      resetTagDraft();
      setTagKindFilter(payload.tag.kind);
      setTagQuery("");
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
      setTagKindFilter(payload.tag.kind);
      setTagQuery("");
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
  const inspectedTags = useMemo(
    () => (editingTrack ? getTrackPreferenceTags(editingTrack) : selectedTags),
    [editingTrack, selectedTags],
  );
  const inspectedTagGroups = useMemo(
    () => groupTagsByKind(inspectedTags),
    [inspectedTags],
  );
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
    (Boolean(editingTag) || selectedTagIds.size < starterTagLimit) &&
    !createTagMutation.isPending &&
    !updateTagMutation.isPending;

  function handleSaveTag() {
    const normalizedNewTag = normalizeTagLabel(newTagLabel);

    if (!normalizedNewTag || (!editingTag && selectedTagIds.size >= starterTagLimit)) {
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
        setSelectedTagIds((current) => new Set(current).add(existingTag.id));
        resetTagDraft();
        setTagQuery("");
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
    setTagKindFilter(kind);
    setTagQuery("");
  }, []);

  const handleArchive = useCallback((track: StarterTrackWithTags) => {
    if (confirmArchiveId === track.id) {
      archiveMutation.mutate(track.id);
      return;
    }

    setConfirmArchiveId(track.id);
  }, [archiveMutation, confirmArchiveId]);

  const railInspectorContent = useMemo(
    () => (
      <section className="space-y-3 rounded-xl border border-border/28 bg-card/18 p-3">
        {inspectedTrack ? (
          <>
            <div className="space-y-3">
              <EntityCoverImage
                src={inspectedTrack.cover_url}
                alt={`${inspectedTrack.title} cover`}
                sizes="256px"
                className="aspect-square w-full rounded-[0.85rem] border border-border/24 bg-muted/20"
                iconClassName="size-8"
              />
              <div className="min-w-0 space-y-1">
                <p className="text-[0.68rem] font-medium uppercase text-muted-foreground">
                  {editingTrack ? "Editing starter pick" : "Selected from Deezer"}
                </p>
                <h2 className="text-pretty font-serif text-xl font-semibold leading-6 text-foreground">
                  {inspectedTrack.title}
                </h2>
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm text-muted-foreground">
                    {inspectedTrack.artist_name ?? "Unknown artist"}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 shrink-0 border-border/34 px-1.5 text-[0.62rem]",
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

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border/22 bg-background/24 px-3 py-2">
                <p className="text-muted-foreground">Signals</p>
                <p className="mt-1 tabular-nums text-foreground">
                  {formatSignalCount(inspectedTags.length)}
                </p>
              </div>
              <div className="rounded-lg border border-border/22 bg-background/24 px-3 py-2">
                <p className="text-muted-foreground">Missing</p>
                <p className="mt-1 truncate text-foreground">
                  {inspectedMissingKinds.length
                    ? inspectedMissingKinds.map((kind) => getTagKindLabel(kind)).join(", ")
                    : "Ready"}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border/22 bg-background/24 p-2.5">
              {inspectedTagGroups.length > 0 ? (
                inspectedTagGroups.map((group) => (
                  <div key={group.kind} className="space-y-1.5">
                    <p className="text-[0.65rem] font-medium uppercase text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="h-5 border-border/42 px-1.5 text-[0.62rem] text-muted-foreground"
                        >
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs leading-5 text-muted-foreground">
                  No signals yet. Choose tags from the library before saving.
                </p>
              )}

              {inspectedMissingKinds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 border-t border-border/18 pt-2">
                  {inspectedMissingKinds.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => focusTagKind(kind)}
                      className="inline-flex h-6 items-center rounded-md border border-amber-500/22 bg-amber-500/7 px-2 text-[0.62rem] font-medium text-amber-100/78 transition-colors hover:border-amber-300/30 hover:text-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      Find {getTagKindLabel(kind)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Editorial prompt"
              className="h-9 rounded-lg bg-background/44 text-sm"
            />

            <Textarea
              value={editorialNote}
              onChange={(event) => setEditorialNote(event.target.value)}
              placeholder="Why this pick belongs here"
              maxLength={240}
              className="min-h-20 resize-none rounded-lg bg-background/44 text-sm"
            />

            <div className="flex items-center gap-3 rounded-lg border border-border/24 bg-background/24 px-3 py-2">
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

            <div className="grid gap-2">
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
                {editingTrack ? "Save changes" : "Add starter pick"}
              </Button>

              <div className="grid grid-cols-2 gap-2">
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
                      isConfirmingInspectedArchive && "border border-amber-500/24 bg-amber-500/7 text-amber-100/86 hover:bg-amber-500/10",
                    )}
                  >
                    {pendingArchiveId === editingTrack.id ? (
                      <LoaderCircle className="size-3 animate-spin" />
                    ) : (
                      <Archive className="size-3" />
                    )}
                    {isConfirmingInspectedArchive ? "Confirm" : "Archive"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled
                    className="h-9"
                  >
                    Draft
                  </Button>
                )}
              </div>
            </div>
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
      </section>
    ),
    [
      addMutation,
      archiveMutation,
      editingTrack,
      editorialNote,
      featured,
      focusTagKind,
      handleArchive,
      inspectedStatus,
      inspectedIsPending,
      inspectedMissingKinds,
      inspectedTagGroups,
      inspectedTags.length,
      inspectedTrack,
      isConfirmingInspectedArchive,
      pendingArchiveId,
      prompt,
      resetDraft,
    ],
  );

  useEffect(() => {
    setSecondaryRailContent(railInspectorContent);

    return () => {
      setSecondaryRailContent(null);
    };
  }, [railInspectorContent, setSecondaryRailContent]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
      <header className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Kocteau editorial</p>
        <h1 className="font-serif text-3xl font-semibold tracking-normal text-foreground">
          Starter Studio
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Curate the first records people see when For You is still warming up.
        </p>
      </header>

      <section className="relative">
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
      </section>

      {inspectedTrack ? (
        <section className="space-y-3 rounded-xl border border-border/28 bg-card/18 p-3 lg:hidden">
          <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3">
            <EntityCoverImage
              src={inspectedTrack.cover_url}
              alt={`${inspectedTrack.title} cover`}
              sizes="68px"
              className="aspect-square w-full rounded-[0.65rem] border border-border/24 bg-muted/20"
              iconClassName="size-5"
            />
            <div className="min-w-0 space-y-1">
              <p className="text-[0.68rem] font-medium uppercase text-muted-foreground">
                {editingTrack ? "Editing starter pick" : "Selected from Deezer"}
              </p>
              <h2 className="truncate text-sm font-semibold text-foreground">
                {inspectedTrack.title}
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {inspectedTrack.artist_name ?? "Unknown artist"}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 border-border/34 px-1.5 text-[0.62rem]",
                    inspectedStatus === "Ready"
                      ? "text-foreground"
                      : "border-amber-500/22 bg-amber-500/7 text-amber-100/78",
                  )}
                >
                  {inspectedStatus}
                </Badge>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatSignalCount(inspectedTags.length)}
                </span>
              </div>
            </div>
          </div>

          {inspectedMissingKinds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {inspectedMissingKinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => focusTagKind(kind)}
                  className="inline-flex h-7 items-center rounded-md border border-amber-500/22 bg-amber-500/7 px-2 text-xs font-medium text-amber-100/78 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  Find {getTagKindLabel(kind)}
                </button>
              ))}
            </div>
          ) : null}

          <Input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Editorial prompt"
            className="h-9 rounded-lg bg-background/44 text-sm"
          />

          <Textarea
            value={editorialNote}
            onChange={(event) => setEditorialNote(event.target.value)}
            placeholder="Why this pick belongs here"
            maxLength={240}
            className="min-h-16 resize-none rounded-lg bg-background/44 text-sm"
          />

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
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
              {editingTrack ? "Save" : "Add"}
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
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-xl border border-border/28 bg-card/18 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Tags className="size-4 text-muted-foreground" />
            Signal library
          </div>
          <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
            <span>{starterTracks.length} picks</span>
            <span className="size-1 rounded-full bg-muted-foreground/30" />
            <span>{formatSelectedSignalCount(selectedTagIds.size)}</span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kindCoverage.map((stat) => {
            const isActive = tagKindFilter === stat.kind;
            const coverageLabel =
              stat.tagCount === 0
                ? "No tags"
                : `${stat.coveredTagCount}/${stat.tagCount} covered`;

            return (
              <button
                key={stat.kind}
                type="button"
                onClick={() => setTagKindFilter(isActive ? "all" : stat.kind)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                  isActive
                    ? "border-foreground/32 bg-foreground/[0.075]"
                    : "border-border/30 bg-background/24 hover:border-foreground/18 hover:bg-muted/18",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-foreground">
                    {stat.label}
                  </p>
                  <span className="text-[0.65rem] tabular-nums text-muted-foreground">
                    {stat.uncoveredTagCount}
                  </span>
                </div>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">
                  {coverageLabel}
                </p>
              </button>
            );
          })}
        </div>

        {untaggedStarterCount > 0 ? (
          <p className="rounded-lg border border-amber-500/24 bg-amber-500/7 px-3 py-2 text-xs text-amber-100/78">
            {untaggedStarterCount} starter pick{untaggedStarterCount === 1 ? "" : "s"} need signals.
          </p>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-3">
            <div className="rounded-lg border border-border/24 bg-background/24 p-2.5">
              {selectedTagGroups.length > 0 ? (
                <div className="space-y-2">
                  {selectedTagGroups.map((group) => (
                    <div
                      key={group.kind}
                      className="grid gap-1.5 sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:items-start"
                    >
                      <p className="pt-1 text-[0.65rem] font-medium uppercase text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            asChild
                            variant="outline"
                            className="h-6 border-foreground/28 bg-foreground/[0.06] px-2 text-xs text-foreground"
                          >
                            <button type="button" onClick={() => toggleTag(tag.id)}>
                              {tag.label}
                              <X className="size-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-1 py-1.5 text-xs text-muted-foreground">
                  Six signals is ready. Add more only when they sharpen the pick.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                value={tagQuery}
                onChange={(event) => setTagQuery(event.target.value)}
                placeholder="Filter signals..."
                className="h-9 rounded-lg bg-background/44 text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTagKindFilter("all")}
                  className={cn(
                    "h-7 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                    tagKindFilter === "all"
                      ? "border-foreground/30 bg-foreground/[0.075] text-foreground"
                      : "border-border/32 bg-background/24 text-muted-foreground hover:text-foreground",
                  )}
                >
                  All
                </button>
                {starterTagKinds.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setTagKindFilter(kind)}
                    className={cn(
                      "h-7 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                      tagKindFilter === kind
                        ? "border-foreground/30 bg-foreground/[0.075] text-foreground"
                        : "border-border/32 bg-background/24 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {preferenceKindLabels[kind]}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {filteredTagGroups.map((group) => (
                <div key={group.kind} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.65rem] font-medium uppercase text-muted-foreground">
                      {group.label}
                    </p>
                    <p className="truncate text-[0.65rem] text-muted-foreground/70">
                      {preferenceKindDescriptions[group.kind as PreferenceKind]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => {
                      const isSelected = selectedTagIds.has(tag.id);
                      const coverageCount = coverageByTagId.get(tag.id) ?? 0;

                      return (
                        <span
                          key={tag.id}
                          className={cn(
                            "inline-flex h-8 max-w-full items-center rounded-md border text-xs font-medium transition-colors",
                            isSelected
                              ? "border-foreground/38 bg-foreground text-background"
                              : "border-border/42 bg-muted/14 text-foreground hover:border-foreground/22 hover:bg-muted/36",
                          )}
                        >
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleTag(tag.id)}
                            className="flex h-full min-w-0 items-center gap-1.5 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                          >
                            <span className="truncate">{tag.label}</span>
                            <span
                              className={cn(
                                "rounded-full px-1.5 text-[0.62rem] tabular-nums",
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
                              "grid h-full w-7 place-items-center border-l transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                              isSelected
                                ? "border-background/20 text-background/76 hover:text-background"
                                : "border-border/34 text-muted-foreground hover:text-foreground",
                            )}
                            aria-label={`Edit ${tag.label}`}
                          >
                            <Pencil className="size-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredTagGroups.length === 0 ? (
                <p className="rounded-lg border border-border/24 bg-background/24 px-3 py-5 text-center text-xs text-muted-foreground">
                  No matching signals.
                </p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-3 rounded-lg border border-border/24 bg-background/24 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-foreground">
                  {editingTag ? "Edit signal" : "Create signal"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {editingTag ? editingTag.slug : "Build the vocabulary as you curate."}
                </p>
              </div>
              {editingTag ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={resetTagDraft}
                >
                  <X className="size-2.5" />
                  New
                </Button>
              ) : null}
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
              className="h-9 rounded-lg bg-background/44 text-sm"
            />

            <div className="grid grid-cols-2 gap-1.5">
              {starterTagKinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={newTagKind === kind}
                  onClick={() => setNewTagKind(kind)}
                  className={cn(
                    "h-8 rounded-md border px-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
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
              className="h-9 rounded-lg bg-background/44 text-sm"
            />

            <div className="flex items-center gap-3 rounded-lg border border-border/24 bg-card/18 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">Featured</p>
                <p className="truncate text-xs text-muted-foreground">
                  Show in default tag views
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
              className="h-9 w-full"
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
          </aside>
        </div>
      </section>

      <div className="min-h-0">
        <section className="min-w-0 space-y-5">
          <section className="space-y-3 rounded-xl border border-border/28 bg-card/18 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Candidate finder
                  </h2>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Deezer suggests, Kocteau filters, you curate.
                </p>
              </div>
              {candidateTracksQuery.isFetching ? (
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              ) : candidateTracksQuery.data?.seed_label ? (
                <span className="rounded-md border border-border/28 bg-background/24 px-2 py-1 text-xs text-muted-foreground">
                  Seed: {candidateTracksQuery.data.seed_label}
                </span>
              ) : null}
            </div>

            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={candidateQuery}
                  onChange={(event) => setCandidateQuery(event.target.value)}
                  placeholder="Seed artist or scene"
                  className="h-9 rounded-lg bg-background/44 pl-9 text-sm"
                />
              </div>
              <div className="flex gap-1.5">
                {candidateModes.map((mode) => {
                  const isActive = candidateMode === mode.value;

                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setCandidateMode(mode.value)}
                      className={cn(
                        "h-9 rounded-md border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                        isActive
                          ? "border-foreground/30 bg-foreground/[0.075] text-foreground"
                          : "border-border/32 bg-background/24 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {candidateTracksQuery.error ? (
              <p className="rounded-lg border border-destructive/34 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {candidateTracksQuery.error.message}
              </p>
            ) : null}

            {normalizedCandidateQuery.length < 2 ? (
              <p className="rounded-lg border border-border/24 bg-background/24 px-3 py-5 text-center text-sm text-muted-foreground">
                Try a seed artist like Cocteau Twins, Broadcast, or Michael Jackson.
              </p>
            ) : null}

            {normalizedCandidateQuery.length >= 2 &&
            !candidateTracksQuery.isFetching &&
            candidateResults.length === 0 ? (
              <p className="rounded-lg border border-border/24 bg-background/24 px-3 py-5 text-center text-sm text-muted-foreground">
                No candidates survived the filter. Try another seed or switch modes.
              </p>
            ) : null}

            {candidateResults.length > 0 ? (
              <div className="grid gap-2 xl:grid-cols-2">
                {candidateResults.map((track) => {
                  const isSelected =
                    selectedDraftTrack?.provider_id === track.provider_id ||
                    editingTrack?.provider_id === track.provider_id;
                  const isQueued = queuedCandidateProviderIds.has(track.provider_id);
                  const isQueueing =
                    queueCandidateMutation.isPending &&
                    queueCandidateMutation.variables?.provider_id === track.provider_id;

                  return (
                    <article
                      key={track.candidate_id}
                      className={cn(
                        "grid min-h-[5.75rem] grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-border/28 bg-background/24 p-2.5 transition-colors",
                        isSelected && "border-foreground/34 bg-foreground/[0.055]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => selectSearchTrack(track)}
                        className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                      >
                        <TrackCover src={track.cover_url} title={track.title} />
                        <span className="min-w-0 space-y-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {track.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {track.artist_name ?? "Unknown artist"}
                          </span>
                          <span className="flex flex-wrap gap-1">
                            <Badge
                              variant="outline"
                              className="h-4 border-border/42 px-1.5 text-[0.56rem] text-muted-foreground"
                            >
                              {track.source_label}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="h-4 border-border/42 px-1.5 text-[0.56rem] text-muted-foreground"
                            >
                              {candidateTierLabels[track.tier] ?? track.tier}
                            </Badge>
                          </span>
                          <span className="block line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {track.reason}
                          </span>
                        </span>
                      </button>
                      <div className="flex flex-col gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "secondary" : "outline"}
                          disabled={addMutation.isPending}
                          onClick={() => selectSearchTrack(track)}
                          className="h-8 gap-1.5"
                        >
                          {isSelected ? <Check className="size-3" /> : <Plus className="size-3" />}
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={isQueued || queueCandidateMutation.isPending}
                          onClick={() => queueCandidateMutation.mutate(track)}
                          className="h-8 gap-1.5 text-muted-foreground"
                        >
                          {isQueueing ? (
                            <LoaderCircle className="size-3 animate-spin" />
                          ) : isQueued ? (
                            <Check className="size-3" />
                          ) : (
                            <Plus className="size-3" />
                          )}
                          {isQueued ? "Queued" : "Queue"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setDismissedCandidateKeys((current) =>
                              new Set(current).add(
                                `${candidateDismissalScope}:${track.provider_id}`,
                              ),
                            )
                          }
                          className="h-8 gap-1.5 text-muted-foreground"
                        >
                          <X className="size-3" />
                          Skip
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}

            <div className="space-y-2 border-t border-border/20 pt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-medium text-foreground">
                    Saved queue
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Keep candidates for slower listening before they become starter picks.
                  </p>
                </div>
                <span className="rounded-md border border-border/28 bg-background/24 px-2 py-1 text-xs tabular-nums text-muted-foreground">
                  {editorialCandidateQueue.length}
                </span>
              </div>

              {editorialCandidateQueueQuery.isLoading ? (
                <div className="flex min-h-20 items-center justify-center rounded-lg border border-border/24 bg-background/24">
                  <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : null}

              {editorialCandidateQueueQuery.error ? (
                <p className="rounded-lg border border-amber-500/24 bg-amber-500/7 px-3 py-2 text-sm text-amber-100/78">
                  Candidate queue needs the latest Supabase migration.
                </p>
              ) : null}

              {!editorialCandidateQueueQuery.isLoading &&
              !editorialCandidateQueueQuery.error &&
              editorialCandidateQueue.length === 0 ? (
                <p className="rounded-lg border border-border/24 bg-background/24 px-3 py-5 text-center text-sm text-muted-foreground">
                  No saved candidates yet.
                </p>
              ) : null}

              {editorialCandidateQueue.length > 0 ? (
                <div className="grid gap-2 xl:grid-cols-2">
                  {editorialCandidateQueue.map((candidate) => {
                    const isSelected =
                      selectedCandidateId === candidate.id ||
                      selectedDraftTrack?.provider_id === candidate.provider_id ||
                      editingTrack?.provider_id === candidate.provider_id;
                    const isDeciding =
                      decideCandidateMutation.isPending &&
                      decideCandidateMutation.variables?.id === candidate.id;

                    return (
                      <article
                        key={candidate.id}
                        className={cn(
                          "grid min-h-[5.25rem] grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-border/28 bg-background/24 p-2.5 transition-colors",
                          isSelected && "border-foreground/34 bg-foreground/[0.055]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => selectSearchTrack(candidate, candidate.id)}
                          className="grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                        >
                          <TrackCover src={candidate.cover_url} title={candidate.title} />
                          <span className="min-w-0 space-y-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {candidate.title}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {candidate.artist_name ?? "Unknown artist"}
                            </span>
                            <span className="flex flex-wrap gap-1">
                              <Badge
                                variant="outline"
                                className="h-4 border-border/42 px-1.5 text-[0.56rem] text-muted-foreground"
                              >
                                {getEditorialCandidateStatusLabel("queued")}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="h-4 border-border/42 px-1.5 text-[0.56rem] text-muted-foreground"
                              >
                                {candidate.source_label}
                              </Badge>
                            </span>
                            {candidate.reason ? (
                              <span className="block line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {candidate.reason}
                              </span>
                            ) : null}
                          </span>
                        </button>

                        <div className="flex flex-col gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant={isSelected ? "secondary" : "outline"}
                            disabled={addMutation.isPending}
                            onClick={() => selectSearchTrack(candidate, candidate.id)}
                            className="h-8 gap-1.5"
                          >
                            {isSelected ? <Check className="size-3" /> : <Plus className="size-3" />}
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={decideCandidateMutation.isPending}
                            onClick={() =>
                              decideCandidateMutation.mutate({
                                id: candidate.id,
                                status: "dismissed",
                                decision_note: "Dismissed from Studio queue.",
                              })
                            }
                            className="h-8 gap-1.5 text-muted-foreground"
                          >
                            {isDeciding ? (
                              <LoaderCircle className="size-3 animate-spin" />
                            ) : (
                              <X className="size-3" />
                            )}
                            Dismiss
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Deezer results</h2>
              {searchFetching ? (
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>

            <div className="space-y-2">
              {searchError ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/28 bg-card/18 px-3 py-2 text-sm text-muted-foreground">
                  <span className="min-w-0">
                    {searchError.message ||
                      "Music search is taking longer than usual. Try again in a moment."}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={searchFetching}
                    onClick={() => {
                      void retrySearch();
                    }}
                    className="h-7 shrink-0 rounded-full px-2.5 text-[11px]"
                  >
                    {searchFetching ? "Retrying" : "Retry"}
                  </Button>
                </div>
              ) : null}

              {normalizedQuery.length < 2 ? (
                <p className="rounded-lg border border-border/28 bg-card/18 px-3 py-8 text-center text-sm text-muted-foreground">
                  Search by track, artist, or album.
                </p>
              ) : null}

              {(searchResults ?? []).map((track) => {
                const alreadyAdded = existingProviderIds.has(track.provider_id);
                const isSelected =
                  selectedDraftTrack?.provider_id === track.provider_id ||
                  editingTrack?.provider_id === track.provider_id;

                return (
                  <article
                    key={track.provider_id}
                    className={cn(
                      "grid min-h-[4.75rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/28 bg-card/18 p-2.5 transition-colors",
                      isSelected && "border-foreground/34 bg-foreground/[0.055]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => selectSearchTrack(track)}
                      className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      <TrackCover src={track.cover_url} title={track.title} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {track.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {track.artist_name ?? "Unknown artist"}
                        </span>
                      </span>
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                      disabled={addMutation.isPending}
                      onClick={() => selectSearchTrack(track)}
                      className="gap-1.5"
                    >
                      {isSelected ? (
                        <Check className="size-3" />
                      ) : alreadyAdded ? (
                        <Pencil className="size-3" />
                      ) : (
                        <Plus className="size-3" />
                      )}
                      {isSelected ? "Selected" : alreadyAdded ? "Edit" : "Select"}
                    </Button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Starter catalog</h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {filteredStarterTracks.length}/{starterTracks.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {catalogFilters.map((filter) => {
                const isActive = catalogFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setCatalogFilter(filter.value)}
                    className={cn(
                      "h-7 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                      isActive
                        ? "border-foreground/30 bg-foreground/[0.075] text-foreground"
                        : "border-border/32 bg-background/24 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-2 xl:grid-cols-2">
              {starterTracksQuery.isLoading ? (
                <div className="flex min-h-24 items-center justify-center rounded-lg border border-border/28 bg-card/18 xl:col-span-2">
                  <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : null}

              {!starterTracksQuery.isLoading && starterTracks.length === 0 ? (
                <p className="rounded-lg border border-border/28 bg-card/18 px-3 py-8 text-center text-sm text-muted-foreground xl:col-span-2">
                  No starter picks yet.
                </p>
              ) : null}

              {!starterTracksQuery.isLoading &&
              starterTracks.length > 0 &&
              filteredStarterTracks.length === 0 ? (
                <p className="rounded-lg border border-border/28 bg-card/18 px-3 py-8 text-center text-sm text-muted-foreground xl:col-span-2">
                  No starter picks match this view.
                </p>
              ) : null}

              {filteredStarterTracks.map((track) => {
                const isArchiving = pendingArchiveId === track.id;
                const tags = track.starter_track_tags ?? [];
                const isEditing = editingTrack?.id === track.id;
                const missingKinds = getMissingEditorialKinds(track);
                const status = getTrackStatus(track);
                const isConfirmingArchive = confirmArchiveId === track.id;

                return (
                  <article
                    key={track.id}
                    className={cn(
                      "grid min-h-[4.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border/28 bg-card/18 p-2 transition-colors",
                      track.is_featured && "border-foreground/18",
                      isEditing && "border-foreground/34 bg-foreground/[0.055]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => startEditing(track)}
                      className="grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-2.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      <TrackCover src={track.cover_url} title={track.title} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {track.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {track.artist_name ?? "Unknown artist"}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-4 border-border/42 px-1.5 text-[0.56rem] text-muted-foreground",
                              status !== "Ready" && "border-amber-500/22 bg-amber-500/7 text-amber-100/78",
                            )}
                          >
                            {status}
                          </Badge>
                          {track.is_featured ? (
                            <Badge
                              variant="outline"
                              className="h-4 border-border/42 px-1.5 text-[0.56rem] text-muted-foreground"
                            >
                              Featured
                            </Badge>
                          ) : null}
                          {tags.length ? (
                            <>
                              {tags.slice(0, 2).flatMap((tag) =>
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
                              {tags.length > 2 ? (
                                <Badge
                                  variant="outline"
                                  className="h-4 border-border/42 px-1.5 text-[0.56rem] text-muted-foreground"
                                >
                                  +{tags.length - 2}
                                </Badge>
                              ) : null}
                            </>
                          ) : null}
                          {tags.length > 0 && missingKinds.length > 0
                            ? missingKinds.map((kind) => (
                                <Badge
                                  key={kind}
                                  variant="outline"
                                  className="h-4 border-amber-500/22 bg-amber-500/7 px-1.5 text-[0.56rem] text-amber-100/78"
                                >
                                  No {getTagKindLabel(kind).toLowerCase()}
                                </Badge>
                              ))
                            : null}
                        </span>
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant={isEditing ? "secondary" : "ghost"}
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
                        onClick={() => handleArchive(track)}
                        title={isConfirmingArchive ? "Confirm archive" : "Archive starter pick"}
                        className={cn(
                          isConfirmingArchive && "border border-amber-500/24 bg-amber-500/7 text-amber-100/86 hover:bg-amber-500/10",
                        )}
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
          </section>
        </section>

      </div>
    </div>
  );
}
