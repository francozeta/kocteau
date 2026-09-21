import type { DiscoverySeed } from "./seed";
import type { TrackRecommendationGroup } from "../recommendations/track-recommendation-ranking";

export const CANVAS_LIMIT = 30;
export const PATH_LIMIT = 12;
export const MEMORY_LIMIT = 80;
export const MEMORY_TTL = 30 * 24 * 60 * 60 * 1000;

export type DiscoveryVisit = {
  key: string;
  artist: string;
  count: number;
  lastOpened: number;
};
export type DiscoveryCandidate = {
  seed: DiscoverySeed;
  lane: TrackRecommendationGroup["id"];
  reason: string;
  score: number;
};
export type CanvasNode = {
  seed: DiscoverySeed;
  from: string | null;
  reason: string;
  depth: number;
};
export type CanvasFrame = {
  id: string;
  focus: DiscoverySeed | null;
  nodes: CanvasNode[];
  depth: number;
  resolved: boolean;
};
export type CanvasSession = { frames: CanvasFrame[]; cursor: number };

export function seedKey(seed: DiscoverySeed) {
  return `deezer:${seed.type}:${seed.provider_id}`;
}

function artistKey(seed: DiscoverySeed) {
  return (
    (seed.type === "artist" ? seed.title : seed.artist_name)
      ?.trim()
      .toLowerCase() ?? ""
  );
}

export function recordDiscoveryVisit(
  memory: DiscoveryVisit[],
  seed: DiscoverySeed,
  now: number,
) {
  const key = seedKey(seed);
  const previous = memory.find((visit) => visit.key === key);
  return [
    {
      key,
      artist: artistKey(seed),
      count: Math.min((previous?.count ?? 0) + 1, 8),
      lastOpened: now,
    },
    ...memory.filter(
      (visit) => visit.key !== key && now - visit.lastOpened < MEMORY_TTL,
    ),
  ].slice(0, MEMORY_LIMIT);
}

// Taste is a small influence, not a gate: unfamiliar artists keep room to surface.
export function evaluateCandidate({
  seed,
  candidate,
  context,
}: {
  seed: DiscoverySeed;
  candidate: DiscoveryCandidate;
  context: { memory: DiscoveryVisit[]; now: number };
}) {
  if (!candidate.seed.cover_url || seedKey(seed) === seedKey(candidate.seed))
    return -Infinity;
  const artist = artistKey(candidate.seed);
  const familiarity = artist
    ? context.memory.reduce((total, visit) => {
        const recency = Math.max(
          0,
          1 - (context.now - visit.lastOpened) / MEMORY_TTL,
        );
        return (
          total +
          (visit.artist === artist ? Math.min(visit.count, 3) * recency : 0)
        );
      }, 0)
    : 0;
  const visited = context.memory.some(
    (visit) =>
      visit.key === seedKey(candidate.seed) &&
      context.now - visit.lastOpened < MEMORY_TTL,
  );
  return (
    Math.log1p(Math.max(0, candidate.score)) +
    Math.min(familiarity, 3) +
    (visited ? -4 : 2) -
    (artist && artist === artistKey(seed) ? 2 : 0)
  );
}

export function candidatesFromGroups(
  groups: TrackRecommendationGroup[],
): DiscoveryCandidate[] {
  return groups.flatMap((group) =>
    group.recommendations.map((track) => ({
      seed: {
        id: track.id,
        entityId: track.source === "local-signal" ? track.id : null,
        provider_id: track.provider_id,
        type: track.type,
        title: track.title,
        artist_name: track.artist_name,
        artist_provider_id: null,
        cover_url: track.cover_url,
      },
      lane: group.id,
      reason: track.reason,
      score: track.score,
    })),
  );
}

export function rankDiscoveryCandidates(
  seed: DiscoverySeed,
  candidates: DiscoveryCandidate[],
  memory: DiscoveryVisit[],
  now: number,
) {
  const lanes: TrackRecommendationGroup["id"][] = [
    "nearby",
    "left-field",
    "deep-cut",
    "serendipity",
  ];
  const ranked = lanes.map((lane) =>
    candidates
      .filter((candidate) => candidate.lane === lane)
      .map((candidate) => ({
        candidate,
        score: evaluateCandidate({ seed, candidate, context: { memory, now } }),
      }))
      .filter(({ score }) => Number.isFinite(score))
      .sort(
        (a, b) =>
          b.score - a.score ||
          seedKey(a.candidate.seed).localeCompare(seedKey(b.candidate.seed)),
      ),
  );
  const selected: DiscoveryCandidate[] = [];
  const keys = new Set([seedKey(seed)]);
  const covers = new Set([seed.cover_url?.split("?")[0]]);
  const artists = new Map<string, number>();
  for (
    let index = 0;
    index < Math.max(0, ...ranked.map((lane) => lane.length));
    index++
  ) {
    for (const lane of ranked) {
      const candidate = lane[index]?.candidate;
      if (!candidate) continue;
      const key = seedKey(candidate.seed);
      const cover = candidate.seed.cover_url?.split("?")[0];
      const artist = artistKey(candidate.seed);
      if (
        keys.has(key) ||
        covers.has(cover) ||
        (artist && (artists.get(artist) ?? 0) >= 2)
      )
        continue;
      keys.add(key);
      covers.add(cover);
      if (artist) artists.set(artist, (artists.get(artist) ?? 0) + 1);
      selected.push(candidate);
      if (selected.length === CANVAS_LIMIT) return selected;
    }
  }
  return selected;
}

export function createCanvasFrame(
  seeds: DiscoverySeed[],
  focus: DiscoverySeed | null,
  id: string,
): CanvasFrame {
  return {
    id,
    focus,
    depth: 0,
    resolved: false,
    nodes: seeds.slice(0, CANVAS_LIMIT).map((seed) => ({
      seed,
      from: null,
      depth: 0,
      reason: "Starting point",
    })),
  };
}

export function focusCanvasNode(
  session: CanvasSession,
  seed: DiscoverySeed,
  id: string,
  restart = false,
): CanvasSession {
  const current = session.frames[session.cursor];
  if (!restart && current.focus && seedKey(current.focus) === seedKey(seed))
    return session;
  const frame: CanvasFrame = {
    id,
    focus: seed,
    depth: restart || !current.focus ? 0 : current.depth + 1,
    resolved: false,
    nodes: [
      ...(current.focus
        ? [
            {
              seed: current.focus,
              from: null,
              reason: "Your path",
              depth: current.depth,
            },
          ]
        : []),
      ...current.nodes.filter((node) => seedKey(node.seed) !== seedKey(seed)),
    ].slice(0, CANVAS_LIMIT),
  };
  const frames = [...session.frames.slice(0, session.cursor + 1), frame].slice(
    -PATH_LIMIT,
  );
  return { frames, cursor: frames.length - 1 };
}

export function expandCanvasFrame(
  session: CanvasSession,
  frameId: string,
  candidates: DiscoveryCandidate[],
  memory: DiscoveryVisit[],
  now: number,
): CanvasSession {
  const frame = session.frames[session.cursor];
  if (frame.id !== frameId || !frame.focus) return session;
  const ranked = rankDiscoveryCandidates(frame.focus, candidates, memory, now);
  if (!ranked.length) return session;
  const focusKey = seedKey(frame.focus);
  // Keep a small piece of the previous space while new branches enter it.
  const retained = frame.nodes
    .filter((node) => node.from !== focusKey)
    .slice(0, 6);
  const nodes = [...retained];
  const keys = new Set([
    focusKey,
    ...retained.map((node) => seedKey(node.seed)),
  ]);
  const covers = new Set([
    frame.focus.cover_url,
    ...retained.map((node) => node.seed.cover_url),
  ]);
  for (const candidate of ranked) {
    if (
      keys.has(seedKey(candidate.seed)) ||
      covers.has(candidate.seed.cover_url)
    )
      continue;
    nodes.push({
      seed: candidate.seed,
      from: focusKey,
      reason: candidate.reason,
      depth: frame.depth + 1,
    });
    keys.add(seedKey(candidate.seed));
    covers.add(candidate.seed.cover_url);
    if (nodes.length >= CANVAS_LIMIT) break;
  }
  const frames = session.frames.with(session.cursor, { ...frame, nodes });
  return { ...session, frames };
}
