"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DiscoveryOrbit, {
  type DiscoveryOrbitItem,
} from "@/components/discovery-orbit";
import EntityCoverImage from "@/components/entity-cover-image";
import { Input } from "@/components/ui/input";
import { Search } from "@/components/ui/icons";
import { useKocteauSearch, type KocteauSearchResult } from "@/hooks/use-kocteau-search";
import type {
  TrackRecommendationCandidate,
  TrackRecommendationGroup,
} from "@/lib/recommendations/track-recommendation-ranking";
import type { StarterTrack } from "@/lib/starter";
import { cn } from "@/lib/utils";

type DiscoveryMapProps = {
  seeds?: StarterTrack[];
  initialSeedProviderId?: string | null;
};

type DiscoveryMapResponse = {
  groups: TrackRecommendationGroup[];
  seed: DiscoverySeed;
};

type DiscoverySeed = {
  id: string;
  entityId: string | null;
  provider_id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
};

const EMPTY_GROUPS: TrackRecommendationGroup[] = [];
const ORBIT_LIMIT = 15;
const routeOrder: TrackRecommendationGroup["id"][] = [
  "left-field",
  "serendipity",
  "nearby",
  "deep-cut",
];
const starterPositionClasses = [
  "left-[8%] top-[17%] sm:left-[12%] sm:top-[18%] lg:left-[16%]",
  "right-[8%] top-[18%] sm:right-[12%] sm:top-[16%] lg:right-[17%]",
  "bottom-[17%] left-[12%] sm:bottom-[16%] sm:left-[18%] lg:left-[22%]",
  "bottom-[16%] right-[10%] sm:bottom-[18%] sm:right-[17%] lg:right-[21%]",
  "hidden sm:block sm:left-[31%] sm:top-[11%] lg:left-[34%]",
  "hidden sm:block sm:right-[30%] sm:bottom-[10%] lg:right-[33%]",
] as const;

function mapStarterTrackToSeed(track: StarterTrack): DiscoverySeed {
  return {
    id: track.id,
    entityId: null,
    provider_id: track.provider_id,
    title: track.title,
    artist_name: track.artist_name,
    cover_url: track.cover_url,
  };
}

function mapSearchResultToSeed(result: KocteauSearchResult): DiscoverySeed {
  return {
    id: result.entity_id ?? `deezer:${result.provider_id}`,
    entityId: result.entity_id ?? null,
    provider_id: result.provider_id,
    title: result.title,
    artist_name: result.artist_name,
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

function buildOrbitItems(
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
  const seenProviderIds = new Set(seed ? [seed.provider_id] : []);
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
    href: recommendation.href,
    routeLabel: group.shortLabel,
    reason: recommendation.reason,
    providerId: recommendation.provider_id,
    entityId:
      recommendation.source === "local-signal" ? recommendation.id : null,
  }));
}

async function fetchDiscoveryMap(
  seed: DiscoverySeed,
  { expanded = false }: { expanded?: boolean } = {},
) {
  const params = new URLSearchParams({
    providerId: seed.provider_id,
    title: seed.title,
  });

  if (seed.artist_name) {
    params.set("artistName", seed.artist_name);
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

  const payload = (await response.json()) as Pick<DiscoveryMapResponse, "groups">;

  return { ...payload, seed };
}

export default function DiscoveryMap({
  seeds = [],
  initialSeedProviderId,
}: DiscoveryMapProps) {
  const starterSeeds = useMemo(
    () => seeds.slice(0, 6).map(mapStarterTrackToSeed),
    [seeds],
  );
  const initialSeed = useMemo(
    () =>
      starterSeeds.find(
        (seed) => seed.provider_id === initialSeedProviderId,
      ) ?? null,
    [initialSeedProviderId, starterSeeds],
  );
  const [selectedSeed, setSelectedSeed] = useState<DiscoverySeed | null>(initialSeed);
  const [focusedSeedProviderId, setFocusedSeedProviderId] = useState<string | null>(
    initialSeed?.provider_id ?? null,
  );
  const [seedQuery, setSeedQuery] = useState("");
  const seedSearch = useKocteauSearch({
    query: seedQuery,
    type: "track",
    enabled: seedQuery.trim().length >= 2,
    debounceMs: 120,
  });
  const seedResults = seedSearch.isPlaceholderData
    ? []
    : (seedSearch.data ?? [])
        .filter((result) => result.type === "track")
        .slice(0, 5);
  const mapQuery = useQuery({
    queryKey: ["discovery-map", selectedSeed?.provider_id],
    queryFn: () => fetchDiscoveryMap(selectedSeed as DiscoverySeed),
    enabled: Boolean(selectedSeed),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
  const expandedMapQuery = useQuery({
    queryKey: ["discovery-map-expanded", selectedSeed?.provider_id],
    queryFn: () =>
      fetchDiscoveryMap(selectedSeed as DiscoverySeed, { expanded: true }),
    enabled: Boolean(
      selectedSeed &&
        mapQuery.isSuccess &&
        !mapQuery.isPlaceholderData &&
        mapQuery.data?.seed.provider_id === selectedSeed.provider_id,
    ),
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });
  const resolvedMap = expandedMapQuery.data ?? mapQuery.data;
  const groups = resolvedMap?.groups ?? EMPTY_GROUPS;
  const resolvedSeed = resolvedMap?.seed ?? selectedSeed;
  const orbitItems = useMemo(
    () => buildOrbitItems(groups, resolvedSeed),
    [groups, resolvedSeed],
  );
  const orbitSeed = useMemo(
    () =>
      resolvedSeed
        ? {
            id: `seed:${resolvedSeed.provider_id}`,
            title: resolvedSeed.title,
            artistName: resolvedSeed.artist_name,
            coverUrl: resolvedSeed.cover_url,
            href: `/track/deezer/${encodeURIComponent(resolvedSeed.provider_id)}`,
          }
        : null,
    [resolvedSeed],
  );
  const handleOrbitSelect = useCallback((item: DiscoveryOrbitItem) => {
    setSelectedSeed({
      id: item.id,
      entityId: item.entityId,
      provider_id: item.providerId,
      title: item.title,
      artist_name: item.artistName,
      cover_url: item.coverUrl,
    });
    setFocusedSeedProviderId(item.providerId);
    setSeedQuery("");
  }, []);

  const chooseSearchSeed = (result: KocteauSearchResult) => {
    setSelectedSeed(mapSearchResultToSeed(result));
    setFocusedSeedProviderId(result.provider_id);
    setSeedQuery("");
  };

  return (
    <section
      className="relative h-[calc(100svh-4rem)] min-h-[32rem] overflow-hidden lg:h-[calc(100dvh-4.65rem)] lg:min-h-[32rem]"
      aria-labelledby="discovery-map-title"
      data-kocteau-full-width
      data-kocteau-full-bleed
    >
      <h2 id="discovery-map-title" className="sr-only">
        Music discovery map
      </h2>

      {!selectedSeed && starterSeeds.length > 0 ? (
        <div
          className="absolute inset-0 z-10 transition-opacity duration-200"
          aria-label="Optional starting tracks"
        >
          {starterSeeds.map((seed, index) => (
            <button
              key={seed.id}
              type="button"
              aria-label={`Start from ${seed.title} by ${seed.artist_name || "Unknown artist"}`}
              onClick={() => {
                setSelectedSeed(seed);
                setFocusedSeedProviderId(seed.provider_id);
              }}
              className={cn(
                "absolute rounded-[0.55rem] opacity-64 outline-none transition-[opacity,transform] duration-200 hover:scale-[1.06] hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/45 active:scale-[0.98]",
                starterPositionClasses[index],
              )}
            >
              <EntityCoverImage
                src={seed.cover_url}
                alt=""
                sizes="(max-width: 640px) 56px, (max-width: 1024px) 64px, 80px"
                quality={78}
                variant="thumbnail"
                className="size-14 rounded-[0.55rem] bg-muted/30 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] sm:size-16 lg:size-20"
                iconClassName="size-4"
              />
            </button>
          ))}
        </div>
      ) : null}

      <form
        className={cn(
          "absolute inset-x-0 z-40 mx-auto flex w-full max-w-2xl items-start px-4 transition-[top,transform] duration-300 ease-[var(--kocteau-ease)] sm:px-6 lg:px-0",
          selectedSeed
            ? "top-4 sm:top-5 lg:top-6"
            : "top-1/2 -translate-y-1/2",
        )}
        onSubmit={(event) => {
          event.preventDefault();
          const firstResult = seedResults[0];

          if (firstResult) {
            chooseSearchSeed(firstResult);
          }
        }}
        role="search"
      >
        <div className="relative min-w-0 flex-1">
          <label htmlFor="discovery-seed-search" className="sr-only">
            Search a track or artist to start
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-[1.35rem] z-10 size-4 -translate-y-1/2 text-muted-foreground/62" />
          <Input
            id="discovery-seed-search"
            data-global-search-input="true"
            value={seedQuery}
            onChange={(event) => setSeedQuery(event.target.value)}
            placeholder="Search a track or artist…"
            autoComplete="off"
            aria-expanded={seedResults.length > 0}
            aria-controls="discovery-seed-results"
            className="h-11 rounded-[var(--kocteau-radius-control)] border-transparent bg-[var(--kocteau-surface-control)] pl-10 text-base shadow-[var(--kocteau-shadow-control)] placeholder:text-muted-foreground/58 sm:text-[13px]"
          />

          {seedQuery.trim().length >= 2 ? (
            <div
              id="discovery-seed-results"
              className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-40 overflow-hidden rounded-[0.75rem] bg-[var(--kocteau-surface-raised)] p-1.5 shadow-[var(--kocteau-shadow-card)]"
            >
              {seedResults.length > 0 ? (
                <div className="grid gap-0.5">
                  {seedResults.map((result) => (
                    <button
                      key={`${result.provider}:${result.provider_id}`}
                      type="button"
                      onClick={() => chooseSearchSeed(result)}
                      className="grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-2.5 rounded-[0.6rem] p-1.5 text-left outline-none transition-colors duration-150 hover:bg-foreground/[0.045] focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <EntityCoverImage
                        src={result.cover_url}
                        alt=""
                        sizes="44px"
                        quality={70}
                        variant="thumbnail"
                        className="size-11 rounded-[0.5rem] bg-muted/30"
                        iconClassName="size-3.5"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-pixel text-[12px] font-medium text-foreground/88">
                          {result.title}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground/56">
                          {result.artist_name || "Unknown artist"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-4 text-[11px] text-muted-foreground/58">
                  {seedSearch.isFetching
                    ? "Searching the catalog…"
                    : "No tracks found. Try another name."}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </form>

      <div className="absolute inset-0 overflow-hidden">
        {selectedSeed && mapQuery.isPending ? (
          <div
            className="grid h-full min-h-[24rem] place-items-center px-4 py-8 sm:min-h-[30rem]"
            aria-live="polite"
          >
            <div className="flex max-h-full min-w-0 flex-col items-center">
              <EntityCoverImage
                src={selectedSeed.cover_url}
                alt=""
                sizes="(max-width: 640px) 68vw, 42vh"
                quality={88}
                variant="card"
                className="aspect-square w-[min(68vw,17rem)] shrink-0 rounded-[0.35rem] bg-muted/30 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] sm:w-[min(42vh,21rem)]"
                iconClassName="size-8"
              />
              <div className="mt-4 max-w-[min(82vw,28rem)] text-center">
                <p className="text-balance font-pixel text-[0.98rem] font-medium leading-tight text-foreground sm:text-[1.08rem]">
                  {selectedSeed.title}
                </p>
                <p className="mt-1 truncate text-[12px] text-muted-foreground/72 sm:text-[13px]">
                  {selectedSeed.artist_name || "Unknown artist"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {selectedSeed && !mapQuery.isPending && mapQuery.isError ? (
          <div className="grid h-full min-h-[24rem] place-items-center text-center sm:min-h-[30rem]">
            <button
              type="button"
              onClick={() => void mapQuery.refetch()}
              className="rounded-[0.55rem] px-3 py-2 text-[12px] text-muted-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              Try this route again
            </button>
          </div>
        ) : null}

        {orbitSeed && !mapQuery.isPending && !mapQuery.isError && orbitItems.length > 0 ? (
          <DiscoveryOrbit
            seed={orbitSeed}
            items={orbitItems}
            keepSeedFocused={
              focusedSeedProviderId === resolvedSeed?.provider_id
            }
            onSelect={handleOrbitSelect}
          />
        ) : null}
      </div>
    </section>
  );
}
