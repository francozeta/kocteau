"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import DiscoveryOrbit, {
  type DiscoveryOrbitItem,
} from "@/components/discovery-orbit";
import DiscoverySeedActions from "@/components/discovery-seed-actions";
import EntityCoverImage from "@/components/entity-cover-image";
import { KocteauSearchIcon } from "@/components/kocteau-icons";
import { Input } from "@/components/ui/input";
import { XIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useKocteauSearch,
  type KocteauSearchResult,
} from "@/hooks/use-kocteau-search";
import { useIsMobile } from "@/hooks/use-mobile";
import { getDiscoverySeedPath, type DiscoverySeed } from "@/lib/discovery/seed";
import {
  mergeTrackRecommendationGroups,
  type TrackRecommendationCandidate,
  type TrackRecommendationGroup,
} from "@/lib/recommendations/track-recommendation-ranking";
import type { StarterTrack } from "@/lib/starter";
import { cn } from "@/lib/utils";

type DiscoveryMapProps = {
  seeds?: StarterTrack[];
  initialQuery?: string;
  initialSeed?: DiscoverySeed | null;
};

type DiscoveryMapResponse = {
  groups: TrackRecommendationGroup[];
  seed: DiscoverySeed;
};

type DiscoveryHistoryState = {
  kocteauDiscovery?: true;
  kocteauDiscoverySeed?: DiscoverySeed | null;
};

const ORBIT_LIMIT = 23;
const routeOrder: TrackRecommendationGroup["id"][] = [
  "left-field",
  "serendipity",
  "nearby",
  "deep-cut",
];

function subscribeToMobileSearchDock() {
  return () => {};
}

function getMobileSearchDockSnapshot() {
  return document.getElementById("mobile-search-dock");
}

function getMobileSearchDockServerSnapshot() {
  return null;
}

function getSearchPortalTargetSnapshot() {
  return document.querySelector<HTMLElement>("[data-kocteau-scroll-boundary]");
}

function getDesktopSearchPortalTargetSnapshot() {
  return document.querySelector<HTMLElement>("[data-kocteau-search-surface]");
}

function mapStarterTrackToSeed(track: StarterTrack): DiscoverySeed {
  return {
    id: track.id,
    entityId: null,
    provider_id: track.provider_id,
    type: "track",
    title: track.title,
    artist_name: track.artist_name,
    artist_provider_id: null,
    cover_url: track.cover_url,
  };
}

function mapSearchResultToSeed(result: KocteauSearchResult): DiscoverySeed {
  return {
    id: result.entity_id ?? `deezer:${result.type}:${result.provider_id}`,
    entityId: result.entity_id ?? null,
    provider_id: result.provider_id,
    type: result.type,
    title: result.title,
    artist_name: result.artist_name,
    artist_provider_id:
      result.type === "artist"
        ? result.provider_id
        : (result.artist_provider_id ?? null),
    cover_url: result.cover_url,
  };
}

function normalizeCoverKey(coverUrl: string | null) {
  return coverUrl?.split("?")[0]?.trim().toLowerCase() ?? "";
}

function getArtistKey(artistName: string | null) {
  return artistName?.trim().toLowerCase() || "unknown";
}

function getObscurity(candidate: TrackRecommendationCandidate) {
  const fanCount = candidate.artistFanCount;
  const catalogRank = candidate.catalogRank;
  let score = 0;

  if (typeof fanCount === "number") {
    score += Math.max(0, 1_000_000 - fanCount) / 1_000_000;
  }

  if (typeof catalogRank === "number") {
    score += Math.max(0, 750_000 - catalogRank) / 750_000;
  }

  return score;
}

function buildStarterOrbitItems(seeds: DiscoverySeed[]) {
  const seenProviderIds = new Set<string>();
  const seenCovers = new Set<string>();
  const artistCounts = new Map<string, number>();
  const items: DiscoveryOrbitItem[] = [];

  for (const seed of seeds) {
    const coverKey = normalizeCoverKey(seed.cover_url);
    const artistKey = getArtistKey(seed.artist_name);

    if (
      !coverKey ||
      seenProviderIds.has(seed.provider_id) ||
      seenCovers.has(coverKey) ||
      (artistCounts.get(artistKey) ?? 0) >= 2
    ) {
      continue;
    }

    items.push({
      id: `starter:${seed.provider_id}`,
      title: seed.title,
      artistName: seed.artist_name,
      coverUrl: seed.cover_url,
      href: getDiscoverySeedPath(seed),
      type: "track",
      routeLabel: "Starting point",
      reason: "An editorial opening into the map.",
      providerId: seed.provider_id,
      entityId: seed.entityId,
      artistProviderId: seed.artist_provider_id,
    });
    seenProviderIds.add(seed.provider_id);
    seenCovers.add(coverKey);
    artistCounts.set(artistKey, (artistCounts.get(artistKey) ?? 0) + 1);
  }

  return items.slice(0, ORBIT_LIMIT);
}

function buildRecommendationOrbitItems(
  groups: TrackRecommendationGroup[],
  seed: DiscoverySeed | null,
) {
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const orderedGroups = routeOrder
    .map((id) => groupById.get(id))
    .filter((group): group is TrackRecommendationGroup => Boolean(group))
    .map((group) => ({
      ...group,
      recommendations: group.recommendations.toSorted(
        (left, right) => getObscurity(right) - getObscurity(left),
      ),
    }));
  const interleaved: Array<{
    group: TrackRecommendationGroup;
    recommendation: TrackRecommendationCandidate;
  }> = [];
  const longestGroup = Math.max(
    0,
    ...orderedGroups.map((group) => group.recommendations.length),
  );

  for (let index = 0; index < longestGroup; index += 1) {
    for (const group of orderedGroups) {
      const recommendation = group.recommendations[index];

      if (recommendation) {
        interleaved.push({ group, recommendation });
      }
    }
  }

  const selected: typeof interleaved = [];
  const seenProviderIds = new Set(
    seed?.type === "track" ? [seed.provider_id] : [],
  );
  const seenCovers = new Set(
    seed?.cover_url ? [normalizeCoverKey(seed.cover_url)] : [],
  );
  const artistCounts = new Map<string, number>();

  const selectPass = (artistLimit: number) => {
    for (const candidate of interleaved) {
      if (selected.length >= ORBIT_LIMIT) {
        break;
      }

      const { recommendation } = candidate;
      const coverKey = normalizeCoverKey(recommendation.cover_url);
      const artistKey = getArtistKey(recommendation.artist_name);

      if (
        !coverKey ||
        seenProviderIds.has(recommendation.provider_id) ||
        seenCovers.has(coverKey) ||
        (artistCounts.get(artistKey) ?? 0) >= artistLimit
      ) {
        continue;
      }

      selected.push(candidate);
      seenProviderIds.add(recommendation.provider_id);
      seenCovers.add(coverKey);
      artistCounts.set(artistKey, (artistCounts.get(artistKey) ?? 0) + 1);
    }
  };

  selectPass(1);
  selectPass(2);

  return selected.map<DiscoveryOrbitItem>(({ group, recommendation }) => ({
    id: `${group.id}:${recommendation.provider_id}`,
    title: recommendation.title,
    artistName: recommendation.artist_name,
    coverUrl: recommendation.cover_url,
    href: getDiscoverySeedPath({
      provider_id: recommendation.provider_id,
      title: recommendation.title,
      type: "track",
    }),
    type: "track",
    routeLabel: group.shortLabel,
    reason: recommendation.reason,
    providerId: recommendation.provider_id,
    entityId:
      recommendation.source === "local-signal" ? recommendation.id : null,
    artistProviderId: null,
  }));
}

async function fetchDiscoveryMap(
  seed: DiscoverySeed,
  { expanded = false }: { expanded?: boolean } = {},
) {
  const params = new URLSearchParams({
    providerId: seed.provider_id,
    seedType: seed.type,
    title: seed.title,
  });

  if (seed.artist_name) {
    params.set("artistName", seed.artist_name);
  }

  if (seed.artist_provider_id) {
    params.set("artistProviderId", seed.artist_provider_id);
  }

  if (seed.entityId) {
    params.set("entityId", seed.entityId);
  }

  if (expanded) {
    params.set("expanded", "true");
  }

  const response = await fetch(`/api/discovery/map?${params.toString()}`);

  if (!response.ok) {
    throw new Error("The map could not open this route.");
  }

  const payload = (await response.json()) as Pick<
    DiscoveryMapResponse,
    "groups"
  >;

  return { ...payload, seed };
}

function getSeedHref(seed: DiscoverySeed) {
  return getDiscoverySeedPath(seed);
}

function getResultTypeLabel(result: KocteauSearchResult) {
  if (result.type === "artist") return result.artist_type || "Artist";
  if (result.type === "album") return result.album_record_type || "Album";
  return "Song";
}

function getResultMetadataLabel(result: KocteauSearchResult) {
  if (result.type === "artist") {
    return result.disambiguation || "Artist";
  }

  if (result.type === "album") {
    return [result.artist_name, result.album_record_type || "Album"]
      .filter(Boolean)
      .join(" · ");
  }

  return result.artist_name || "Unknown artist";
}

type DiscoverySearchProps = {
  query: string;
  results: KocteauSearchResult[];
  isSearching: boolean;
  isExpanding: boolean;
  onQueryChange: (query: string) => void;
  onChooseResult: (result: KocteauSearchResult) => void;
  onSubmit: () => boolean;
  mobile?: boolean;
};

function DiscoverySearch({
  query,
  results,
  isSearching,
  isExpanding,
  onQueryChange,
  onChooseResult,
  onSubmit,
  mobile = false,
}: DiscoverySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isMobileViewport = useIsMobile();
  const portalTarget = useSyncExternalStore(
    subscribeToMobileSearchDock,
    mobile
      ? getSearchPortalTargetSnapshot
      : getDesktopSearchPortalTargetSnapshot,
    getMobileSearchDockServerSnapshot,
  );
  const hasQuery = query.trim().length >= 2;
  const resultListId = mobile
    ? "mobile-discovery-seed-results"
    : "discovery-seed-results";
  const inputId = mobile
    ? "mobile-discovery-seed-search"
    : "discovery-seed-search";

  const chooseResult = (result: KocteauSearchResult) => {
    inputRef.current?.blur();
    setIsFocused(false);

    onChooseResult(result);
  };

  const resultList =
    mobile === isMobileViewport && hasQuery && (!mobile || isFocused) ? (
      <div
        className={cn(
          "z-[100000] overflow-y-auto bg-background",
          mobile
            ? "fixed inset-0 px-3 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-[calc(env(safe-area-inset-top)+4.5rem)] sm:px-6"
            : "absolute inset-0 px-6 pb-8 pt-20",
        )}
      >
        <div id={resultListId} className="mx-auto w-full max-w-2xl">
          {isSearching ? (
            <div
              aria-busy="true"
              aria-label="Searching the catalog"
              className="grid gap-1"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className="grid min-h-16 grid-cols-[3.25rem_minmax(0,1fr)_3rem] items-center gap-3 px-2 py-1.5"
                >
                  <Skeleton className="size-[3.25rem] rounded-[0.6rem] bg-muted-foreground/[0.1]" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-[min(14rem,62%)] rounded-full bg-muted-foreground/[0.12]" />
                    <Skeleton className="h-2.5 w-[min(9rem,42%)] rounded-full bg-muted-foreground/[0.08]" />
                  </div>
                  <Skeleton className="h-2 w-10 justify-self-end rounded-full bg-muted-foreground/[0.08]" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid gap-1">
              {results.map((result) => (
                <button
                  key={`${result.provider}:${result.type}:${result.provider_id}`}
                  type="button"
                  onPointerDown={(event) => {
                    if (mobile) event.preventDefault();
                  }}
                  onClick={() => chooseResult(result)}
                  className="grid min-h-16 min-w-0 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[0.75rem] px-2 py-1.5 text-left outline-none transition-colors duration-150 hover:bg-foreground/[0.055] focus-visible:ring-2 focus-visible:ring-ring/55"
                >
                  <EntityCoverImage
                    src={result.cover_url}
                    alt=""
                    sizes="52px"
                    quality={70}
                    variant="thumbnail"
                    className={cn(
                      "size-[3.25rem] bg-muted/30",
                      result.type === "artist"
                        ? "rounded-full"
                        : "rounded-[0.6rem]",
                    )}
                    iconClassName="size-3.5"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-pixel text-[12px] font-medium text-foreground/92">
                      {result.title}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-muted-foreground/62">
                      {getResultMetadataLabel(result)}
                    </span>
                  </span>
                  <span className="pr-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/48">
                    {getResultTypeLabel(result)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-4 text-[11px] text-muted-foreground/58">
              No matches. Try another name.
            </p>
          )}
        </div>
      </div>
    ) : null;
  const portaledResultList = resultList && portalTarget
    ? createPortal(resultList, portalTarget)
    : null;

  if (mobile) {
    return (
      <div
        className={cn(
          "grid items-center transition-[grid-template-columns,gap] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
          isFocused
            ? "grid-cols-[minmax(0,1fr)_2.75rem] gap-3"
            : "grid-cols-[minmax(0,1fr)_0fr] gap-0",
        )}
      >
        <form
          role="search"
          className="relative min-w-0"
          onSubmit={(event) => {
            event.preventDefault();
            if (onSubmit()) {
              inputRef.current?.blur();
              setIsFocused(false);
            }
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Search a song, album, or artist to start
          </label>
          <KocteauSearchIcon className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[1.08rem] -translate-y-1/2 text-muted-foreground/62" />
          <Input
            ref={inputRef}
            id={inputId}
            data-global-search-input="true"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key !== "Enter") return;

              event.preventDefault();

              if (onSubmit()) {
                inputRef.current?.blur();
                setIsFocused(false);
              }
            }}
            placeholder="Search a song, album, or artist…"
            autoComplete="off"
            maxLength={80}
            aria-expanded={Boolean(isFocused && hasQuery)}
            aria-controls={resultListId}
            className="h-11 rounded-full border-transparent bg-[var(--kocteau-surface-control)] pl-10 pr-4 text-base shadow-none placeholder:text-muted-foreground/58 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring/70"
          />
          {portaledResultList}
        </form>

        <div className="overflow-hidden">
          <button
            type="button"
            aria-label="Close search"
            aria-hidden={!isFocused}
            tabIndex={isFocused ? 0 : -1}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => {
              onQueryChange("");
              inputRef.current?.blur();
              setIsFocused(false);
            }}
            className={cn(
              "flex size-11 items-center justify-center rounded-full bg-[var(--kocteau-surface-control)] text-foreground transition-[opacity,scale,background-color] duration-150 hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
              isFocused ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95",
            )}
          >
            <XIcon className="size-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="relative min-w-0 flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (onSubmit()) {
          inputRef.current?.blur();
          setIsFocused(false);
        }
      }}
      role="search"
    >
      <label htmlFor={inputId} className="sr-only">
        Search a song, album, or artist to start
      </label>
      <KocteauSearchIcon className="pointer-events-none absolute left-3.5 top-[1.35rem] z-10 size-4 -translate-y-1/2 text-muted-foreground/62" />
      <Input
        ref={inputRef}
        id={inputId}
        data-global-search-input="true"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key !== "Escape") return;

          event.preventDefault();
          onQueryChange("");
          inputRef.current?.blur();
          setIsFocused(false);
        }}
        placeholder="Search a song, album, or artist…"
        autoComplete="off"
        maxLength={80}
        aria-expanded={results.length > 0}
        aria-controls={resultListId}
        className="h-11 rounded-full border-transparent bg-[var(--kocteau-surface-control)] pl-10 pr-12 text-base shadow-none placeholder:text-muted-foreground/58 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring/70 sm:text-[13px]"
      />
      {isExpanding ? (
        <span
          className="pointer-events-none absolute right-3.5 top-[1.35rem] size-1.5 -translate-y-1/2 rounded-full bg-foreground/60 motion-safe:animate-pulse"
          aria-hidden="true"
        />
      ) : null}
      <button
        type="button"
        aria-label="Close search"
        aria-hidden={!isFocused}
        tabIndex={isFocused ? 0 : -1}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => {
          onQueryChange("");
          inputRef.current?.blur();
          setIsFocused(false);
        }}
        className={cn(
          "absolute left-[calc(100%+0.75rem)] top-0 flex size-11 items-center justify-center rounded-full bg-[var(--kocteau-surface-control)] text-foreground transition-[opacity,scale,background-color] duration-150 hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
          isFocused ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95",
        )}
      >
        <XIcon className="size-5" />
      </button>
      {portaledResultList}
    </form>
  );
}

export default function DiscoveryMap({
  seeds = [],
  initialQuery = "",
  initialSeed = null,
}: DiscoveryMapProps) {
  const starterSeeds = useMemo(
    () => seeds.slice(0, ORBIT_LIMIT).map(mapStarterTrackToSeed),
    [seeds],
  );
  const starterOrbitItems = useMemo(
    () => buildStarterOrbitItems(starterSeeds),
    [starterSeeds],
  );
  const [selectedSeed, setSelectedSeed] = useState<DiscoverySeed | null>(
    initialSeed,
  );
  const [seedQuery, setSeedQuery] = useState(initialQuery);
  const mobileSearchDock = useSyncExternalStore(
    subscribeToMobileSearchDock,
    getMobileSearchDockSnapshot,
    getMobileSearchDockServerSnapshot,
  );
  const seedSearch = useKocteauSearch({
    query: seedQuery,
    type: "all",
    enabled: seedQuery.trim().length >= 2,
    debounceMs: 80,
  });
  const seedResults = seedSearch.isPlaceholderData
    ? []
    : (seedSearch.data ?? []).slice(0, 7);
  const seedIdentity = selectedSeed
    ? `${selectedSeed.type}:${selectedSeed.provider_id}`
    : null;
  const mapQuery = useQuery({
    queryKey: ["discovery-map", seedIdentity],
    queryFn: () => fetchDiscoveryMap(selectedSeed as DiscoverySeed),
    enabled: Boolean(selectedSeed),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
  const expandedMapQuery = useQuery({
    queryKey: ["discovery-map-expanded", seedIdentity],
    queryFn: () =>
      fetchDiscoveryMap(selectedSeed as DiscoverySeed, { expanded: true }),
    enabled: Boolean(selectedSeed),
    staleTime: 10 * 60 * 1000,
    retry: 0,
    placeholderData: (previousData) => previousData,
  });
  const currentExpandedMap =
    selectedSeed &&
    expandedMapQuery.data?.seed.type === selectedSeed.type &&
    expandedMapQuery.data.seed.provider_id === selectedSeed.provider_id
      ? expandedMapQuery.data
      : null;
  const currentFastMap =
    selectedSeed &&
    mapQuery.data?.seed.type === selectedSeed.type &&
    mapQuery.data.seed.provider_id === selectedSeed.provider_id
      ? mapQuery.data
      : null;
  const groups = useMemo(() => {
    if (currentFastMap || currentExpandedMap) {
      return mergeTrackRecommendationGroups(
        currentFastMap?.groups,
        currentExpandedMap?.groups,
      );
    }

    return mergeTrackRecommendationGroups(
      mapQuery.data?.groups,
      expandedMapQuery.data?.groups,
    );
  }, [
    currentExpandedMap,
    currentFastMap,
    expandedMapQuery.data?.groups,
    mapQuery.data?.groups,
  ]);
  const recommendationOrbitItems = useMemo(
    () => buildRecommendationOrbitItems(groups, selectedSeed),
    [groups, selectedSeed],
  );
  const orbitItems =
    recommendationOrbitItems.length > 0
      ? recommendationOrbitItems
      : starterOrbitItems.filter(
          (item) =>
            selectedSeed?.type !== "track" ||
            item.providerId !== selectedSeed.provider_id,
        );
  const orbitSeed = useMemo(
    () =>
      selectedSeed
        ? {
            id: `seed:${selectedSeed.type}:${selectedSeed.provider_id}`,
            title: selectedSeed.title,
            artistName: selectedSeed.artist_name,
            coverUrl: selectedSeed.cover_url,
            href: getSeedHref(selectedSeed),
            type: selectedSeed.type,
          }
        : null,
    [selectedSeed],
  );
  const isExpanding = Boolean(
    selectedSeed && (mapQuery.isFetching || expandedMapQuery.isFetching),
  );
  const hasMapError = Boolean(
    selectedSeed && mapQuery.isError && expandedMapQuery.isError,
  );
  const hasExplorationIntent = Boolean(selectedSeed || seedQuery.trim());

  useEffect(() => {
    const currentState = (window.history.state ?? {}) as DiscoveryHistoryState;

    if (!currentState.kocteauDiscovery) {
      window.history.replaceState(
        {
          ...currentState,
          kocteauDiscovery: true,
          kocteauDiscoverySeed: initialSeed,
        } satisfies DiscoveryHistoryState,
        "",
        window.location.href,
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as DiscoveryHistoryState | null;

      if (state?.kocteauDiscovery) {
        setSelectedSeed(state.kocteauDiscoverySeed ?? null);
        setSeedQuery("");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialSeed]);

  const selectSeed = useCallback((seed: DiscoverySeed) => {
    setSelectedSeed(seed);
    setSeedQuery("");

    const currentState = (window.history.state ?? {}) as DiscoveryHistoryState;
    window.history.pushState(
      {
        ...currentState,
        kocteauDiscovery: true,
        kocteauDiscoverySeed: seed,
      } satisfies DiscoveryHistoryState,
      "",
      getDiscoverySeedPath(seed),
    );
  }, []);

  const handleOrbitSelect = useCallback(
    (item: DiscoveryOrbitItem) => {
      selectSeed({
        id: item.id,
        entityId: item.entityId,
        provider_id: item.providerId,
        type: item.type,
        title: item.title,
        artist_name: item.artistName,
        artist_provider_id: item.artistProviderId,
        cover_url: item.coverUrl,
      });
    },
    [selectSeed],
  );

  const chooseSearchSeed = (result: KocteauSearchResult) => {
    selectSeed(mapSearchResultToSeed(result));
  };
  const chooseFirstSearchResult = () => {
    const firstResult = seedResults[0];

    if (!firstResult) return false;

    chooseSearchSeed(firstResult);
    return true;
  };

  return (
    <section
      className="relative h-svh min-h-0 overflow-hidden bg-transparent lg:h-full"
      aria-labelledby="discovery-map-title"
      data-kocteau-full-width
      data-kocteau-search-surface
    >
      <h2 id="discovery-map-title" className="sr-only">
        Music discovery map
      </h2>

      <div
        className="kocteau-discovery-dither pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      />

      <div
        className={cn(
          "absolute inset-x-0 z-[100001] mx-auto hidden w-full max-w-2xl items-start px-4 transition-[top,transform] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:flex md:px-6 lg:px-0",
          hasExplorationIntent
            ? "top-4 sm:top-5 lg:top-6"
            : "top-1/2 -translate-y-1/2",
        )}
      >
        <DiscoverySearch
          query={seedQuery}
          results={seedResults}
          isSearching={seedSearch.isFetching}
          isExpanding={isExpanding}
          onQueryChange={setSeedQuery}
          onChooseResult={chooseSearchSeed}
          onSubmit={chooseFirstSearchResult}
        />
      </div>

      {mobileSearchDock
        ? createPortal(
            <DiscoverySearch
              query={seedQuery}
              results={seedResults}
              isSearching={seedSearch.isFetching}
              isExpanding={isExpanding}
              onQueryChange={setSeedQuery}
              onChooseResult={chooseSearchSeed}
              onSubmit={chooseFirstSearchResult}
              mobile
            />,
            mobileSearchDock,
          )
        : null}

      <div className="absolute inset-0 z-10 overflow-hidden">
        {orbitItems.length > 0 ? (
          <DiscoveryOrbit
            seed={orbitSeed}
            items={orbitItems}
            centerSeed={Boolean(orbitSeed)}
            onSelect={handleOrbitSelect}
          />
        ) : null}
      </div>

      <DiscoverySeedActions seed={selectedSeed} />

      {hasMapError ? (
        <div
          className={cn(
            "absolute inset-x-0 z-30 flex justify-center px-4",
            selectedSeed ? "bottom-20 sm:bottom-24" : "bottom-5",
          )}
        >
          <button
            type="button"
            onClick={() => {
              void mapQuery.refetch();
              void expandedMapQuery.refetch();
            }}
            className="rounded-[0.55rem] bg-[var(--kocteau-surface-raised)] px-3 py-2 text-[11px] text-muted-foreground/72 shadow-[var(--kocteau-shadow-control)] outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Try this route again
          </button>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {isExpanding ? "Finding a deeper route." : ""}
      </p>
    </section>
  );
}
