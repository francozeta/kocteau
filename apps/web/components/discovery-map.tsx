"use client";

import { useMemo, useState } from "react";
import DiscoveryOrbit, {
  type DiscoveryOrbitItem,
} from "@/components/discovery-orbit";
import DiscoverySearch from "@/components/discovery-search";
import DiscoveryNavigation from "@/components/discovery-navigation";
import DiscoveryActions from "@/components/discovery-actions";
import { OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT } from "@/hooks/use-global-shortcuts";
import type { SearchScope } from "@/lib/search-types";
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
    routeLabel: "Find similar music",
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
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [seedQuery, setSeedQuery] = useState(initialQuery);
  const [desktopSearchActive, setDesktopSearchActive] = useState(false);
  const seedSearch = useKocteauSearch({
    query: seedQuery,
    type: searchScope,
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
      className="relative flex h-svh min-h-0 flex-col overflow-hidden bg-transparent lg:h-[calc(100dvh-5.25rem)]"
      aria-labelledby="discovery-map-title"
      data-kocteau-full-width
      data-kocteau-search-surface
    >
      <h2 id="discovery-map-title" className="sr-only">
        Music discovery canvas
      </h2>
      <div
        data-kocteau-search-results-surface
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+4rem)] z-30 md:top-0 [&>*]:pointer-events-auto"
      />
      <div
        className="kocteau-discovery-dither pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      />

      {[false, true].map((mobile) => (
        <DiscoverySearch
          key={`${mobile}:${orbitSeed?.id ?? "root"}`}
          mobile={mobile}
          scope={searchScope}
          query={seedQuery}
          results={seedResults}
          isSearching={seedSearch.isFetching}
          hasError={seedSearch.isError}
          onQueryChange={setSeedQuery}
          onSelect={chooseResult}
          onSubmit={chooseFirst}
          onFocusChange={mobile ? undefined : setDesktopSearchActive}
          actions={
            selectedSeed && orbitSeed ? (
              <DiscoveryActions
                key={`${viewerId}:${seedKey(selectedSeed)}`}
                seed={selectedSeed}
                href={orbitSeed.href}
                viewerId={viewerId}
                mobile={mobile}
              />
            ) : null
          }
        />
      ))}

      <DiscoveryNavigation
        scope={searchScope}
        onScopeChange={(scope) => {
          setSearchScope(scope);
          window.dispatchEvent(
            new CustomEvent(OPEN_SEARCH_LAUNCHER_SHORTCUT_EVENT),
          );
        }}
        seed={selectedSeed}
        href={orbitSeed?.href}
        pending={canvas.isExpanding}
        searchActive={desktopSearchActive}
        canGoBack={canvas.canGoBack}
        onBack={canvas.back}
        onRestart={() => {
          setSeedQuery("");
          canvas.restart();
        }}
        onForget={() => {
          setSeedQuery("");
          canvas.forget();
        }}
      />

      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
        <DiscoveryOrbit
          seed={orbitSeed}
          items={orbitItems}
          centerSeed={Boolean(orbitSeed)}
          onSelect={selectCover}
        />
      </div>

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
