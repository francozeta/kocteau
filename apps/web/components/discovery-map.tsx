"use client";

import { useMemo, useState } from "react";
import DiscoveryOrbit, {
  type DiscoveryOrbitItem,
} from "@/components/discovery-orbit";
import DiscoverySearch from "@/components/discovery-search";
import PrefetchLink from "@/components/prefetch-link";
import { useDiscoveryCanvas } from "@/hooks/use-discovery-canvas";
import {
  useKocteauSearch,
  type KocteauSearchResult,
} from "@/hooks/use-kocteau-search";
import { getDiscoveryEntityPath } from "@/lib/discovery/navigation";
import { seedKey } from "@/lib/discovery/canvas";
import type { DiscoverySeed } from "@/lib/discovery/seed";
import type { StarterTrack } from "@/lib/starter";

type DiscoveryMapProps = {
  seeds?: StarterTrack[];
  initialQuery?: string;
  initialSeed?: DiscoverySeed | null;
  viewerId?: string | null;
};

function toOrbitItem(
  seed: DiscoverySeed,
  reason = "Explore from here",
): DiscoveryOrbitItem {
  return {
    id: seedKey(seed),
    title: seed.title,
    artistName: seed.artist_name,
    coverUrl: seed.cover_url,
    type: seed.type,
    providerId: seed.provider_id,
    entityId: seed.entityId,
    artistProviderId: seed.artist_provider_id,
    routeLabel: "Explore",
    reason,
    href: getDiscoveryEntityPath({
      entityId: seed.entityId,
      providerId: seed.provider_id,
      type: seed.type,
      title: seed.title,
      artistName: seed.artist_name,
    }),
  };
}

export default function DiscoveryMap({
  seeds = [],
  initialQuery = "",
  initialSeed = null,
  viewerId = null,
}: DiscoveryMapProps) {
  const starterSeeds = useMemo(
    () =>
      seeds.map(
        (track): DiscoverySeed => ({
          id: track.id,
          entityId: null,
          provider_id: track.provider_id,
          type: "track",
          title: track.title,
          artist_name: track.artist_name,
          artist_provider_id: null,
          cover_url: track.cover_url,
        }),
      ),
    [seeds],
  );
  const canvas = useDiscoveryCanvas(starterSeeds, initialSeed, viewerId);
  const selectedSeed = canvas.frame.focus;
  const [seedQuery, setSeedQuery] = useState(initialQuery);
  const seedSearch = useKocteauSearch({
    query: seedQuery,
    type: "all",
    enabled: seedQuery.trim().length >= 2,
    debounceMs: 80,
  });
  const seedResults = seedSearch.isPlaceholderData
    ? []
    : (seedSearch.data ?? []).slice(0, 7);
  const orbitItems = useMemo(
    () => canvas.frame.nodes.map((node) => toOrbitItem(node.seed, node.reason)),
    [canvas.frame.nodes],
  );
  const orbitSeed = useMemo(
    () => (selectedSeed ? toOrbitItem(selectedSeed) : null),
    [selectedSeed],
  );

  const chooseResult = (result: KocteauSearchResult) => {
    canvas.explore(
      {
        id: `${result.type}:${result.provider_id}`,
        entityId: result.entity_id ?? null,
        provider_id: result.provider_id,
        type: result.type,
        title: result.title,
        artist_name: result.artist_name,
        artist_provider_id: result.artist_provider_id ?? null,
        cover_url: result.cover_url,
      },
      true,
    );
    setSeedQuery("");
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>("[data-discovery-focus]")
        ?.focus({ preventScroll: true }),
    );
  };
  const chooseFirst = () => {
    if (!seedResults[0] || seedSearch.isFetching) return false;
    chooseResult(seedResults[0]);
    return true;
  };
  const selectCover = (item: DiscoveryOrbitItem) => {
    canvas.explore({
      id: item.id,
      entityId: item.entityId,
      provider_id: item.providerId,
      type: item.type,
      title: item.title,
      artist_name: item.artistName,
      artist_provider_id: item.artistProviderId,
      cover_url: item.coverUrl,
    });
  };

  return (
    <section
      className="relative h-svh min-h-0 overflow-hidden bg-transparent lg:h-[calc(100dvh-5.25rem)]"
      aria-labelledby="discovery-map-title"
      data-kocteau-full-width
      data-kocteau-search-surface
    >
      <h2 id="discovery-map-title" className="sr-only">
        Music discovery canvas
      </h2>
      <div
        data-kocteau-search-results-surface
        className="pointer-events-none absolute inset-0 z-30 [&>*]:pointer-events-auto"
      />
      <div
        className="kocteau-discovery-dither pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      />

      {[false, true].map((mobile) => (
        <DiscoverySearch
          key={String(mobile)}
          mobile={mobile}
          query={seedQuery}
          results={seedResults}
          isSearching={seedSearch.isFetching}
          hasError={seedSearch.isError}
          isExpanding={canvas.isExpanding}
          onQueryChange={setSeedQuery}
          onSelect={chooseResult}
          onSubmit={chooseFirst}
        />
      ))}

      <div className="absolute inset-0 z-10 overflow-hidden">
        <DiscoveryOrbit
          seed={orbitSeed}
          items={orbitItems}
          centerSeed={Boolean(orbitSeed)}
          onSelect={selectCover}
        />
      </div>

      {selectedSeed && orbitSeed ? (
        <nav
          aria-label="Canvas path"
          className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-20 flex min-w-0 items-start gap-3 lg:inset-x-6 lg:top-3"
        >
          {canvas.canGoBack ? (
            <button
              type="button"
              onClick={canvas.back}
              className="min-h-11 shrink-0 rounded-full bg-[var(--kocteau-surface-control)] px-3 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Back
            </button>
          ) : null}
          <div className="min-w-0 py-2">
            <PrefetchLink
              href={orbitSeed.href}
              data-discovery-focus
              className="block max-w-64 truncate rounded-sm text-xs text-foreground underline decoration-foreground/25 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {selectedSeed.title}
            </PrefetchLink>
            <p className="mt-1 text-[10px] text-muted-foreground" role="status">
              {canvas.isExpanding
                ? "Finding new paths…"
                : "Choose a cover to keep exploring."}
            </p>
          </div>
          <button
            type="button"
            onClick={canvas.forget}
            title="Clear exploration memory on this browser"
            className="ms-auto min-h-11 shrink-0 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Start fresh
          </button>
        </nav>
      ) : null}

      {canvas.hasError ? (
        <button
          type="button"
          onClick={canvas.retry}
          className="absolute bottom-28 left-1/2 z-20 min-h-11 -translate-x-1/2 rounded-full bg-[var(--kocteau-surface-control)] px-4 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:bottom-5"
        >
          Some paths couldn’t load. Retry
        </button>
      ) : null}
      {!orbitItems.length && !selectedSeed ? (
        <p className="pointer-events-none absolute inset-x-6 top-1/2 text-center text-sm text-muted-foreground">
          Search for music to start exploring.
        </p>
      ) : null}
    </section>
  );
}
