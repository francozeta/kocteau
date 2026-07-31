export type TrackRecommendationSource =
  | "local-signal"
  | "deezer-related"
  | "deezer-deep-cut";

export type TrackRecommendationCandidate = {
  id: string;
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  href: string;
  reason: string;
  source: TrackRecommendationSource;
  sourceLabel: string;
  score: number;
  catalogRank?: number | null;
  artistFanCount?: number | null;
};

export type TrackRecommendationGroup = {
  id: "nearby" | "deep-cut" | "left-field" | "serendipity";
  label: string;
  shortLabel: string;
  description: string;
  recommendations: TrackRecommendationCandidate[];
};

type SelectTrackRecommendationGroupsOptions = {
  currentProviderId: string;
  relatedCandidates: TrackRecommendationCandidate[];
  localSignalCandidates: TrackRecommendationCandidate[];
  deepCutCandidates?: TrackRecommendationCandidate[];
  perGroupLimit?: number;
};

const sourcePriority: Record<TrackRecommendationSource, number> = {
  "local-signal": 5,
  "deezer-deep-cut": 4,
  "deezer-related": 3,
};

const sourceScoreBonus: Record<TrackRecommendationSource, number> = {
  "local-signal": 18,
  "deezer-deep-cut": 14,
  "deezer-related": 10,
};

export function getTrackRecommendationQueryLabel({
  title,
  artistName,
}: {
  title: string;
  artistName?: string | null;
}) {
  const normalizedArtistName = artistName?.trim();

  return normalizedArtistName || title.trim();
}

function getCandidateKey(candidate: TrackRecommendationCandidate) {
  return `${candidate.provider}:${candidate.type}:${candidate.provider_id}`;
}

function getArtistKey(candidate: TrackRecommendationCandidate) {
  return candidate.artist_name?.trim().toLowerCase() || "unknown";
}

function getStableExplorationBonus(
  candidate: TrackRecommendationCandidate,
  currentProviderId: string,
) {
  const key = `${currentProviderId}:${candidate.provider_id}`;
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 997;
  }

  return (hash % 13) / 2;
}

function getExperimentalScore(
  candidate: TrackRecommendationCandidate,
  currentProviderId: string,
) {
  return (
    candidate.score +
    sourceScoreBonus[candidate.source] +
    getStableExplorationBonus(candidate, currentProviderId)
  );
}

function getObscurityScore(candidate: TrackRecommendationCandidate) {
  const fanCount = candidate.artistFanCount;
  const catalogRank = candidate.catalogRank;
  let score = 0;

  if (typeof fanCount === "number") {
    if (fanCount <= 25_000) score += 30;
    else if (fanCount <= 250_000) score += 18;
    else if (fanCount >= 1_000_000) score -= 18;
  }

  if (typeof catalogRank === "number") {
    if (catalogRank <= 150_000) score += 16;
    else if (catalogRank >= 750_000) score -= 14;
  }

  return score;
}

function diversifyByArtist(
  candidates: TrackRecommendationCandidate[],
  limit: number,
) {
  const selected: TrackRecommendationCandidate[] = [];
  const deferred: TrackRecommendationCandidate[] = [];
  const artistCounts = new Map<string, number>();
  const softArtistLimit = 2;

  candidates.forEach((candidate) => {
    const artistKey = getArtistKey(candidate);
    const artistCount = artistCounts.get(artistKey) ?? 0;

    if (artistCount < softArtistLimit) {
      selected.push(candidate);
      artistCounts.set(artistKey, artistCount + 1);
      return;
    }

    deferred.push(candidate);
  });

  return [...selected, ...deferred].slice(0, limit);
}

function dedupeCandidates(
  candidates: TrackRecommendationCandidate[],
  currentProviderId: string,
) {
  const bestByKey = new Map<string, TrackRecommendationCandidate>();

  candidates
    .filter((candidate) => candidate.provider_id !== currentProviderId)
    .forEach((candidate) => {
      const key = getCandidateKey(candidate);
      const existing = bestByKey.get(key);

      if (!existing) {
        bestByKey.set(key, candidate);
        return;
      }

      const candidatePriority = sourcePriority[candidate.source];
      const existingPriority = sourcePriority[existing.source];

      if (
        candidatePriority > existingPriority ||
        (candidatePriority === existingPriority && candidate.score > existing.score)
      ) {
        bestByKey.set(key, candidate);
      }
    });

  return Array.from(bestByKey.values());
}

function rankCandidates({
  candidates,
  currentProviderId,
  route,
}: {
  candidates: TrackRecommendationCandidate[];
  currentProviderId: string;
  route: TrackRecommendationGroup["id"];
}) {
  return candidates.toSorted((left, right) => {
    if (route === "left-field") {
      const obscurityDelta = getObscurityScore(right) - getObscurityScore(left);

      if (obscurityDelta !== 0) {
        return obscurityDelta;
      }
    }

    if (route === "serendipity") {
      const driftDelta =
        getStableExplorationBonus(right, currentProviderId) -
        getStableExplorationBonus(left, currentProviderId);

      if (driftDelta !== 0) {
        return driftDelta;
      }
    }

    const scoreDelta =
      getExperimentalScore(right, currentProviderId) -
      getExperimentalScore(left, currentProviderId);

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return sourcePriority[right.source] - sourcePriority[left.source];
  });
}

function selectRoute({
  candidates,
  currentProviderId,
  usedCandidateKeys,
  route,
  limit,
}: {
  candidates: TrackRecommendationCandidate[];
  currentProviderId: string;
  usedCandidateKeys: Set<string>;
  route: TrackRecommendationGroup["id"];
  limit: number;
}) {
  const available = candidates.filter(
    (candidate) => !usedCandidateKeys.has(getCandidateKey(candidate)),
  );
  const selected = diversifyByArtist(
    rankCandidates({ candidates: available, currentProviderId, route }),
    limit,
  );

  selected.forEach((candidate) => {
    usedCandidateKeys.add(getCandidateKey(candidate));
  });

  return selected;
}

export function selectTrackRecommendationGroups({
  currentProviderId,
  relatedCandidates,
  localSignalCandidates,
  deepCutCandidates = [],
  perGroupLimit = 4,
}: SelectTrackRecommendationGroupsOptions): TrackRecommendationGroup[] {
  const limit = Math.max(1, Math.min(perGroupLimit, 8));
  const candidates = dedupeCandidates(
    [...localSignalCandidates, ...relatedCandidates, ...deepCutCandidates],
    currentProviderId,
  );

  if (candidates.length === 0) {
    return [];
  }

  const usedCandidateKeys = new Set<string>();
  const nearby = selectRoute({
    candidates: candidates.filter((candidate) => candidate.source !== "deezer-deep-cut"),
    currentProviderId,
    usedCandidateKeys,
    route: "nearby",
    limit,
  });
  const deepCut = selectRoute({
    candidates: candidates.filter((candidate) => candidate.source === "deezer-deep-cut"),
    currentProviderId,
    usedCandidateKeys,
    route: "deep-cut",
    limit,
  });
  const leftField = selectRoute({
    candidates: candidates.filter((candidate) => candidate.source === "deezer-related"),
    currentProviderId,
    usedCandidateKeys,
    route: "left-field",
    limit,
  });
  const serendipity = selectRoute({
    candidates,
    currentProviderId,
    usedCandidateKeys,
    route: "serendipity",
    limit,
  });

  const groups: Array<TrackRecommendationGroup | null> = [
    nearby.length > 0
      ? {
          id: "nearby",
          label: "Stay close",
          shortLabel: "Nearby",
          description: "Shared artist orbit and Kocteau signals.",
          recommendations: nearby,
        }
      : null,
    deepCut.length > 0
      ? {
          id: "deep-cut",
          label: "Go deeper",
          shortLabel: "Deep cut",
          description: "Past the usual entry points in this catalog.",
          recommendations: deepCut,
        }
      : null,
    leftField.length > 0
      ? {
          id: "left-field",
          label: "Go stranger",
          shortLabel: "Further out",
          description: "A quieter edge of the same neighborhood.",
          recommendations: leftField,
        }
      : null,
    serendipity.length > 0
      ? {
          id: "serendipity",
          label: "Drift",
          shortLabel: "Serendipity",
          description: "A controlled left turn from the candidate pool.",
          recommendations: serendipity,
        }
      : null,
  ];

  return groups.filter((group): group is TrackRecommendationGroup => Boolean(group));
}
