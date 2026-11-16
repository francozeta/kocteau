"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import EntityCoverImage from "@/components/music/entity-cover-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rankDiscoveryCandidates, seedKey, type DiscoveryCandidate } from "@/lib/discovery/canvas";
import { createDiscoveryLabSnapshot, type DiscoveryLabPool, type DiscoveryLabSnapshot } from "@/lib/discovery/lab-snapshot";
import { rankMmr, selectionProxies } from "@/lib/discovery/mmr";
import type { DiscoverySeed } from "@/lib/discovery/seed";
import { readSearchReadiness, type SearchReadiness } from "@/lib/search/client-readiness";
import { fetchJsonResponse } from "@/queries/http";
import type { KocteauSearchResult } from "@/queries/tracks";

type PoolRequest = { seed: DiscoverySeed; variation: number };

function seedFromResult(result: KocteauSearchResult): DiscoverySeed {
  return {
    id: result.entity_id ?? `deezer:track:${result.provider_id}`,
    entityId: result.entity_id ?? null,
    type: "track",
    provider_id: result.provider_id,
    title: result.title,
    artist_name: result.artist_name,
    artist_provider_id: result.artist_provider_id ?? null,
    cover_url: result.cover_url,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "This request could not complete. Try again.";
}

function captureResponse(request: PoolRequest, pool: DiscoveryLabPool) {
  return createDiscoveryLabSnapshot(request.seed, pool, Date.now(), request.variation);
}

function RankingPanel({ title, description, items, snapshot }: {
  title: string;
  description: string;
  items: DiscoveryCandidate[];
  snapshot: DiscoveryLabSnapshot;
}) {
  const proxies = selectionProxies(snapshot.input, items);
  return (
    <section className="min-w-0 rounded-xl border border-border p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 min-h-12 text-xs text-muted-foreground">{description}</p>
      <p className="my-3 text-xs text-muted-foreground">
        {items.length} tracks · {proxies.distinctKnownArtists} identified artists · {proxies.distinctLanes} lanes
      </p>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={seedKey(item.seed)} className="flex min-w-0 gap-2.5" data-track-id={item.seed.provider_id}>
            <span className="w-3 pt-3 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
            <EntityCoverImage src={item.seed.cover_url} alt="" sizes="48px" className="size-12 shrink-0 rounded-md" />
            <div className="min-w-0">
              <p className="break-words text-sm">{item.seed.title}</p>
              <p className="break-words text-xs text-muted-foreground">{item.seed.artist_name ?? "Artist unavailable"}</p>
              <p className="mt-1 text-[0.625rem] text-muted-foreground">{item.lane} · {item.seed.provider_id}</p>
            </div>
          </li>
        ))}
      </ol>
      {!items.length && <p className="text-sm text-muted-foreground">No eligible candidates in this snapshot.</p>}
    </section>
  );
}

export default function DiscoveryRankingLab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KocteauSearchResult[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [readiness, setReadiness] = useState<SearchReadiness | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [variation, setVariation] = useState(0);
  const [lambda, setLambda] = useState(0.7);
  const [snapshot, setSnapshot] = useState<DiscoveryLabSnapshot | null>(null);
  const [pending, setPending] = useState<PoolRequest | null>(null);
  const [lastAttempt, setLastAttempt] = useState<PoolRequest | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [poolNotice, setPoolNotice] = useState<string | null>(null);
  const searchRequest = useRef<AbortController | null>(null);
  const poolRequest = useRef<AbortController | null>(null);

  useEffect(() => () => {
    searchRequest.current?.abort();
    poolRequest.current?.abort();
  }, []);

  const panels = useMemo(() => {
    if (!snapshot) return null;
    const input = snapshot.input;
    return {
      current: rankDiscoveryCandidates(input.seed, [...input.candidates], [...input.memory], input.now, input.variation).slice(0, 6),
      control: rankMmr(input, { lambda: 1 }),
      mmr: rankMmr(input, { lambda }),
    };
  }, [snapshot, lambda]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setSearchError("Enter at least two characters.");
      return;
    }
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    setReadiness(null);
    setSearchedQuery(q);
    try {
      const params = new URLSearchParams({ q, type: "track", source: "all" });
      const response = await fetchJsonResponse<KocteauSearchResult[]>(`/api/search?${params}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!Array.isArray(response.data)) throw new Error("Search returned an invalid response. Try again.");
      const seen = new Set<string>();
      setResults(response.data.filter((item) => {
        if (item.provider !== "deezer" || item.type !== "track" || !/^\d+$/.test(item.provider_id) || seen.has(item.provider_id)) return false;
        seen.add(item.provider_id);
        return true;
      }).slice(0, 12));
      setReadiness(readSearchReadiness(response.headers));
    } catch (error) {
      if (!controller.signal.aborted) setSearchError(errorMessage(error));
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }

  async function loadPool(request: PoolRequest) {
    poolRequest.current?.abort();
    const controller = new AbortController();
    poolRequest.current = controller;
    setPending(request);
    setLastAttempt(request);
    setPoolError(null);
    setPoolNotice(null);
    try {
      const params = new URLSearchParams({
        providerId: request.seed.provider_id,
        seedType: "track",
        lane: "full",
        variation: String(request.variation),
      });
      if (request.seed.artist_provider_id) params.set("artistProviderId", request.seed.artist_provider_id);
      const response = await fetchJsonResponse<DiscoveryLabPool>(`/api/discovery/map?${params}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setSnapshot(captureResponse(request, response.data));
    } catch (error) {
      if (!controller.signal.aborted) setPoolError(errorMessage(error));
    } finally {
      if (!controller.signal.aborted) setPending(null);
    }
  }

  function cancelPool() {
    poolRequest.current?.abort();
    setPending(null);
    setPoolNotice("Request cancelled. Any previous snapshot is still shown.");
  }

  function exportSnapshot() {
    if (!snapshot || !panels) return;
    const data = {
      ...snapshot,
      lambda,
      selected: Object.fromEntries(Object.entries(panels).map(([name, items]) => [name, items.map((item) => seedKey(item.seed))])),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `discovery-${snapshot.input.seed.provider_id}-${snapshot.retrievalVariation}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-6 lg:py-8">
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">Studio · Private preview experiment</p>
        <h1 className="text-2xl font-medium tracking-tight">Discovery lab</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Choose a real track, then compare three rankings of one public candidate snapshot.
          Search and For You keep their existing ranking. Nothing is saved to your account.
        </p>
      </header>

      <form onSubmit={search} className="flex flex-wrap items-end gap-3" aria-label="Find a discovery seed">
        <label className="min-w-48 flex-1 space-y-1 text-xs" htmlFor="lab-query">
          <span>Track or artist</span>
          <Input id="lab-query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={200} placeholder="Search the public catalog" />
        </label>
        <label className="w-24 space-y-1 text-xs" htmlFor="lab-variation">
          <span>Pool variation</span>
          <select id="lab-variation" value={variation} onChange={(event) => setVariation(Number(event.target.value))} className="h-7 w-full rounded-md border border-input bg-background px-2">
            {Array.from({ length: 16 }, (_, value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <Button type="submit" disabled={searching || query.trim().length < 2}>{searching ? "Searching…" : "Find tracks"}</Button>
      </form>

      <div aria-live="polite" className="space-y-2 text-sm text-muted-foreground">
        {searchError && <p role="alert">{searchError}</p>}
        {readiness && readiness.status !== "fresh" && <p>Search status: {readiness.status}. Usable results are shown; submit again to retry the sources.</p>}
        {searchedQuery && !searching && !searchError && !results.length && <p>No usable tracks for “{searchedQuery}”. Try another search.</p>}
      </div>
      {!!results.length && (
        <section aria-label={`Seed choices for ${searchedQuery}`} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <button key={result.provider_id} type="button" aria-label={`Compare ${result.title} by ${result.artist_name ?? "unknown artist"}`} onClick={() => void loadPool({ seed: seedFromResult(result), variation })} className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
              <EntityCoverImage src={result.cover_url} alt="" sizes="48px" className="size-12 shrink-0 rounded-md" />
              <span className="min-w-0"><span className="block break-words text-sm">{result.title}</span><span className="block break-words text-xs text-muted-foreground">{result.artist_name ?? "Artist unavailable"}</span></span>
            </button>
          ))}
        </section>
      )}

      <div aria-live="polite" className="space-y-2 text-sm text-muted-foreground">
        {pending && <p>Loading one pool for {pending.seed.title} (variation {pending.variation})… <Button type="button" variant="outline" onClick={cancelPool}>Cancel</Button></p>}
        {poolError && <p role="alert">{poolError} Any previous snapshot is still shown.</p>}
        {poolNotice && <p>{poolNotice}</p>}
        {lastAttempt && !pending && (poolError || poolNotice) && <Button type="button" variant="outline" onClick={() => void loadPool(lastAttempt)}>Retry {lastAttempt.seed.title}</Button>}
      </div>

      {snapshot && panels && (
        <section className="space-y-4" aria-labelledby="lab-snapshot-title">
          <div className="space-y-2 border-t border-border pt-5">
            <h2 id="lab-snapshot-title" className="text-lg">{snapshot.input.seed.title} · {snapshot.input.seed.artist_name ?? "Artist unavailable"}</h2>
            <p className="text-xs text-muted-foreground">Deezer track {snapshot.input.seed.provider_id} · {snapshot.input.candidates.length} candidates · variation {snapshot.retrievalVariation} · captured {new Date(snapshot.input.now).toISOString()}</p>
            {snapshot.partial && <p role="status" className="text-sm">Partial pool: some retrieval sources did not finish. All panels use these same available candidates.</p>}
            {!snapshot.input.candidates.length && <p className="text-sm">The provider returned an empty pool. Try another seed or refresh this one.</p>}
            <p className="max-w-3xl text-xs text-muted-foreground">Same clock, seed, pool and empty listener memory in every panel. MMR uses artist identity only here; album and tag data are unavailable. Counts describe selection, not musical quality. Compare MMR with the relevance control to isolate its diversity penalty.</p>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="lab-lambda" className="flex items-center gap-2 text-xs">MMR relevance weight
                <select id="lab-lambda" value={lambda} onChange={(event) => setLambda(Number(event.target.value))} className="h-7 rounded-md border border-input bg-background px-2"><option value={0.7}>0.7</option><option value={0.4}>0.4</option></select>
              </label>
              <Button type="button" variant="outline" onClick={exportSnapshot}>Export snapshot JSON</Button>
              <Button type="button" variant="outline" disabled={!!pending} onClick={() => void loadPool({ seed: snapshot.input.seed, variation: snapshot.retrievalVariation })}>Refresh this pool</Button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <RankingPanel title="Current" description="Existing lane interleaving and hard selection rules." items={panels.current} snapshot={snapshot} />
            <RankingPanel title="Relevance control" description="Global base relevance with the same hard constraints as MMR (λ = 1)." items={panels.control} snapshot={snapshot} />
            <RankingPanel title={`MMR (λ = ${lambda})`} description="Balances base relevance against repeated artist identity." items={panels.mmr} snapshot={snapshot} />
          </div>
        </section>
      )}
    </div>
  );
}
