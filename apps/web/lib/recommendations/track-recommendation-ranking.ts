export type TrackRecommendationSource = "local-signal" | "deezer-related";

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
};

export type TrackRecommendationGroup = {
  id: "related";
  label: string;
  description: string;
  recommendations: TrackRecommendationCandidate[];
};

type SelectTrackRecommendationGroupsOptions = {
  currentProviderId: string;
  relatedCandidates: TrackRecommendationCandidate[];
  localSignalCandidates: TrackRecommendationCandidate[];
  perGroupLimit?: number;
};

const sourcePriority: Record<TrackRecommendationSource, number> = {
  "local-signal": 4,
  "deezer-related": 3,
};

const sourceScoreBonus: Record<TrackRecommendationSource, number> = {
  "local-signal": 18,
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

function getExperimentalScore(candidate: TrackRecommendationCandidate, currentProviderId: string) {
  return (
    candidate.score +
    sourceScoreBonus[candidate.source] +
    getStableExplorationBonus(candidate, currentProviderId)
  );
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

function selectCandidates({
  candidates,
  currentProviderId,
  limit,
}: {
  candidates: TrackRecommendationCandidate[];
  currentProviderId: string;
  limit: number;
}) {
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

  const ranked = Array.from(bestByKey.values()).sort((left, right) => {
    const scoreDelta =
      getExperimentalScore(right, currentProviderId) -
      getExperimentalScore(left, currentProviderId);

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return sourcePriority[right.source] - sourcePriority[left.source];
  });

  return diversifyByArtist(ranked, limit);
}

export function selectTrackRecommendationGroups({
  currentProviderId,
  relatedCandidates,
  localSignalCandidates,
  perGroupLimit = 6,
}: SelectTrackRecommendationGroupsOptions): TrackRecommendationGroup[] {
  const limit = Math.max(1, Math.min(perGroupLimit, 24));
  const related = selectCandidates({
    candidates: [...localSignalCandidates, ...relatedCandidates],
    currentProviderId,
    limit,
  });

  if (related.length === 0) {
    return [];
  }

  const groups: Array<TrackRecommendationGroup | null> = [
    related.length > 0
      ? {
          id: "related",
          label: "Related",
          description: "Filtered from nearby artists and Kocteau signals.",
          recommendations: related,
        }
      : null,
  ];

  return groups.filter((group): group is TrackRecommendationGroup => Boolean(group));
}
