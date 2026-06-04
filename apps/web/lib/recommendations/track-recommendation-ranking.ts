export type TrackRecommendationSource =
  | "local-signal"
  | "related-seed"
  | "editorial-fallback";

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
  id: "related" | "fallback";
  label: string;
  description: string;
  recommendations: TrackRecommendationCandidate[];
};

type SelectTrackRecommendationGroupsOptions = {
  currentProviderId: string;
  relatedCandidates: TrackRecommendationCandidate[];
  localSignalCandidates: TrackRecommendationCandidate[];
  editorialFallbackCandidates: TrackRecommendationCandidate[];
  perGroupLimit?: number;
};

const sourcePriority: Record<TrackRecommendationSource, number> = {
  "local-signal": 4,
  "related-seed": 3,
  "editorial-fallback": 1,
};

export function getTrackRecommendationSeedLabel({
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

  return Array.from(bestByKey.values())
    .sort((left, right) => {
      const priorityDelta = sourcePriority[right.source] - sourcePriority[left.source];

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return right.score - left.score;
    })
    .slice(0, limit);
}

export function selectTrackRecommendationGroups({
  currentProviderId,
  relatedCandidates,
  localSignalCandidates,
  editorialFallbackCandidates,
  perGroupLimit = 6,
}: SelectTrackRecommendationGroupsOptions): TrackRecommendationGroup[] {
  const limit = Math.max(1, Math.min(perGroupLimit, 24));
  const related = selectCandidates({
    candidates: [...localSignalCandidates, ...relatedCandidates],
    currentProviderId,
    limit,
  });

  if (related.length === 0) {
    const fallback = selectCandidates({
      candidates: editorialFallbackCandidates,
      currentProviderId,
      limit,
    });

    return fallback.length > 0
      ? [
          {
            id: "fallback",
            label: "Curated starters",
            description: "Editorial picks while this track gathers signals.",
            recommendations: fallback,
          },
        ]
      : [];
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
