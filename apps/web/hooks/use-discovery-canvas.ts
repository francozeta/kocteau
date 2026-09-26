"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  candidatesFromGroups,
  createCanvasFrame,
  expandCanvasFrame,
  focusCanvasNode,
  recordDiscoveryVisit,
  seedKey,
  type CanvasSession,
  type DiscoveryVisit,
} from "@/lib/discovery/canvas";
import {
  discoveryMemoryKey,
  parseCanvasSnapshot,
  readCanvasSession,
  readDiscoveryMemory,
} from "@/lib/discovery/memory";
import { getDiscoverySeedPath, type DiscoverySeed } from "@/lib/discovery/seed";
import { matchDiscoverySessionToPath } from "@/lib/discovery/navigation";
import {
  mergeTrackRecommendationGroups,
  type TrackRecommendationGroup,
} from "@/lib/recommendations/track-recommendation-ranking";

async function fetchCandidates(
  seed: DiscoverySeed,
  lane: "fast" | "deep",
  signal: AbortSignal,
) {
  const params = new URLSearchParams({
    providerId: seed.provider_id,
    seedType: seed.type,
    title: seed.title,
    lane,
  });
  if (seed.artist_name) params.set("artistName", seed.artist_name);
  if (seed.artist_provider_id)
    params.set("artistProviderId", seed.artist_provider_id);
  if (seed.entityId) params.set("entityId", seed.entityId);
  const response = await fetch(`/api/discovery/map?${params}`, { signal });
  if (!response.ok) throw new Error("Could not expand this branch.");
  return (await response.json()) as { groups: TrackRecommendationGroup[] };
}

export function useDiscoveryCanvas(
  seeds: DiscoverySeed[],
  initialSeed: DiscoverySeed | null,
  viewerId: string | null,
) {
  const queryClient = useQueryClient();
  const memoryKey = discoveryMemoryKey(viewerId);
  const scope = `${memoryKey}:${initialSeed ? seedKey(initialSeed) : "home"}`;
  const [session, setSession] = useState<CanvasSession>(() => ({
    frames: [createCanvasFrame(seeds, initialSeed, "origin")],
    cursor: 0,
  }));
  const [memory, setMemory] = useState<DiscoveryVisit[]>([]);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<{
    frameId: string;
    done: string[];
    errors: string[];
  }>({ frameId: "", done: [], errors: [] });
  const frame = session.frames[session.cursor];
  const { id: frameId, focus, resolved } = frame;

  useEffect(() => {
    if (!ready) return;
    const query = new URLSearchParams(window.location.search).get("q")?.trim();
    document.title = focus
      ? `Discover from ${focus.title} | Kocteau`
      : `Search${query ? `: ${query}` : ""} | Kocteau`;
  }, [focus, ready]);

  useEffect(() => {
    // Hydrate only after mount; storage is optional and never blocks discovery.
    const restore = () => {
      try {
        const historyEntry = window.history.state?.discovery;
        const stored =
          historyEntry?.scope === scope
            ? parseCanvasSnapshot(historyEntry, Date.now(), scope)
            : readCanvasSession(
                sessionStorage.getItem(`${memoryKey}:session`),
                Date.now(),
                scope,
              );
        const matchingSession = matchDiscoverySessionToPath(
          stored,
          window.location.pathname,
        );
        if (matchingSession) setSession(matchingSession);
        setMemory(
          readDiscoveryMemory(localStorage.getItem(memoryKey), Date.now()),
        );
      } catch {
        /* Storage can be unavailable in private browsing. */
      }
      setReady(true);
    };
    const onPopState = (event: PopStateEvent) => {
      const entry = event.state?.discovery;
      const restored =
        entry?.scope === scope
          ? parseCanvasSnapshot(entry, Date.now(), scope)
          : null;
      const path = window.location.pathname;
      setSession((current) =>
        matchDiscoverySessionToPath(restored, path) ??
        matchDiscoverySessionToPath(current, path) ??
        (path === "/search"
          ? {
              frames: [createCanvasFrame(seeds, null, crypto.randomUUID())],
              cursor: 0,
            }
          : current),
      );
    };
    restore();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [memoryKey, scope, seeds]);

  useEffect(() => {
    if (!ready) return;
    const depth =
      window.history.state?.discovery?.scope === scope
        ? window.history.state.discovery.historyDepth
        : 0;
    window.history.replaceState(
      {
        ...window.history.state,
        discovery: { scope, session, historyDepth: depth, savedAt: Date.now() },
      },
      "",
    );
    try {
      sessionStorage.setItem(
        `${memoryKey}:session`,
        JSON.stringify({ savedAt: Date.now(), scope, session }),
      );
      localStorage.setItem(memoryKey, JSON.stringify(memory));
    } catch {
      /* Continue in memory when browser storage is full or disabled. */
    }
  }, [memory, memoryKey, ready, scope, session]);

  useEffect(() => {
    if (!ready || !focus || resolved) return;
    let active = true;
    const groups: TrackRecommendationGroup[][] = [];
    const done: string[] = [];
    const errors: string[] = [];
    const lanes = ["fast", "deep"] as const;
    const keys = lanes.map((lane) => [
      "discovery-candidates",
      seedKey(focus),
      lane,
    ]);
    lanes.forEach((lane, index) => {
      void queryClient
        .fetchQuery({
          queryKey: keys[index],
          queryFn: ({ signal }) => fetchCandidates(focus, lane, signal),
          staleTime: (lane === "fast" ? 5 : 10) * 60 * 1000,
          gcTime: 15 * 60 * 1000,
          retry: lane === "fast" ? 1 : 0,
        })
        .then((result) => {
          if (!active) return;
          groups[index] = result.groups;
          const candidates = candidatesFromGroups(
            mergeTrackRecommendationGroups(...groups),
          );
          setSession((current) =>
            expandCanvasFrame(current, frameId, candidates, memory, Date.now()),
          );
        })
        .catch(() => {
          if (active) errors.push(lane);
        })
        .finally(() => {
          if (!active) return;
          done.push(lane);
          setLoad({ frameId, done: [...done], errors: [...errors] });
          if (done.length === 2 && errors.length === 0) {
            setSession((current) => {
              const frame = current.frames[current.cursor];
              return frame.id === frameId
                ? {
                    ...current,
                    frames: current.frames.with(current.cursor, {
                      ...frame,
                      resolved: true,
                    }),
                  }
                : current;
            });
          }
        });
    });
    return () => {
      active = false;
      keys.forEach((queryKey) => {
        void queryClient.cancelQueries({ queryKey, exact: true });
      });
    };
  }, [attempt, focus, frameId, memory, queryClient, ready, resolved]);

  const explore = (seed: DiscoverySeed, restart = false) => {
    if (!ready) return;
    const next = focusCanvasNode(session, seed, crypto.randomUUID(), restart);
    if (next === session) return;
    const historyDepth =
      (window.history.state?.discovery?.historyDepth ?? 0) + 1;
    window.history.pushState(
      {
        ...window.history.state,
        discovery: { scope, session: next, historyDepth, savedAt: Date.now() },
      },
      "",
      getDiscoverySeedPath(seed),
    );
    setSession(next);
    setMemory(recordDiscoveryVisit(memory, seed, Date.now()));
  };

  const back = () => {
    if ((window.history.state?.discovery?.historyDepth ?? 0) > 0)
      window.history.back();
    else if (session.cursor > 0)
      setSession({ ...session, cursor: session.cursor - 1 });
  };

  const restart = () => {
    setSession({
      frames: [createCanvasFrame(seeds, null, crypto.randomUUID())],
      cursor: 0,
    });
    window.history.replaceState(
      { ...window.history.state, discovery: null },
      "",
      "/search",
    );
  };

  const forget = () => {
    restart();
    setMemory([]);
    try {
      localStorage.removeItem(memoryKey);
      sessionStorage.removeItem(`${memoryKey}:session`);
    } catch {
      /* Optional storage. */
    }
  };

  return {
    frame,
    explore,
    back,
    forget,
    restart,
    canGoBack: session.cursor > 0,
    isExpanding: Boolean(
      ready &&
        focus &&
        !resolved &&
        (load.frameId !== frameId || load.done.length < 2),
    ),
    hasError: load.frameId === frameId && load.errors.length > 0,
    retry: () => {
      setLoad({ frameId: "", done: [], errors: [] });
      setAttempt((value) => value + 1);
    },
  };
}
