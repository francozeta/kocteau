export type StarterCandidateSource = "related-seed" | "deep-cut";

export type StarterCandidateTier =
  | "emerging"
  | "undercovered"
  | "familiar"
  | "deep-cut"
  | "obvious";

export type StarterCandidateInputTrack = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  rank: number | null;
  artist_id: string | null;
  artist_fan_count: number | null;
};

export type StarterCandidateTrack = StarterCandidateInputTrack & {
  candidate_id: string;
  source: StarterCandidateSource;
  source_label: string;
  seed_label: string;
  tier: StarterCandidateTier;
  reason: string;
  score: number;
  entity_id: null;
};

type StarterCandidateOptions = {
  source: StarterCandidateSource;
  seedLabel: string;
  tracks: StarterCandidateInputTrack[];
  existingProviderIds: Set<string>;
  limit?: number;
};

type CandidatePopularity = {
  rank: number | null;
  artist_fan_count: number | null;
};

const obviousRankFloor = 900_000;
const obviousFanFloor = 750_000;
const deepCutRankCeiling = obviousRankFloor - 1;

function getNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getStarterCandidateTier({
  rank,
  artist_fan_count,
}: CandidatePopularity): StarterCandidateTier {
  const safeRank = getNumber(rank);
  const safeFanCount = getNumber(artist_fan_count);

  if (
    safeRank !== null &&
    safeFanCount !== null &&
    safeRank >= obviousRankFloor &&
    safeFanCount >= obviousFanFloor
  ) {
    return "obvious";
  }

  if (
    (safeFanCount === null || safeFanCount <= 50_000) &&
    (safeRank === null || safeRank <= 250_000)
  ) {
    return "emerging";
  }

  if (
    (safeFanCount === null || safeFanCount <= 250_000) &&
    (safeRank === null || safeRank <= 450_000)
  ) {
    return "undercovered";
  }

  return "familiar";
}

function getSourceLabel(source: StarterCandidateSource) {
  return source === "deep-cut" ? "Deep cut" : "Related seed";
}

function getCandidateReason({
  source,
  seedLabel,
  tier,
}: {
  source: StarterCandidateSource;
  seedLabel: string;
  tier: StarterCandidateTier;
}) {
  if (source === "deep-cut") {
    return `A less obvious ${seedLabel} pick for deep-cut curation.`;
  }

  if (tier === "emerging") {
    return `Related to ${seedLabel}, with a quieter artist profile.`;
  }

  return `Related to ${seedLabel}, but still outside the most obvious chart lane.`;
}

function getCandidateScore(track: StarterCandidateInputTrack, tier: StarterCandidateTier) {
  const rank = getNumber(track.rank);
  const fanCount = getNumber(track.artist_fan_count);
  let score = 50;

  if (tier === "emerging") {
    score += 35;
  } else if (tier === "undercovered") {
    score += 24;
  } else if (tier === "deep-cut") {
    score += 18;
  } else if (tier === "obvious") {
    score -= 40;
  }

  if (rank !== null) {
    if (rank <= 150_000) {
      score += 12;
    } else if (rank >= 750_000) {
      score -= 20;
    }
  }

  if (fanCount !== null) {
    if (fanCount <= 25_000) {
      score += 12;
    } else if (fanCount >= 1_000_000) {
      score -= 18;
    }
  }

  return score;
}

function isUsableForSource(track: StarterCandidateInputTrack, source: StarterCandidateSource) {
  const tier = getStarterCandidateTier(track);

  if (source === "related-seed") {
    return tier !== "obvious";
  }

  const rank = getNumber(track.rank);
  return rank === null || rank <= deepCutRankCeiling;
}

export function buildStarterCandidateTracks({
  source,
  seedLabel,
  tracks,
  existingProviderIds,
  limit = 12,
}: StarterCandidateOptions): StarterCandidateTrack[] {
  const seenProviderIds = new Set<string>();
  const sourceLabel = getSourceLabel(source);

  return tracks
    .filter((track) => {
      if (existingProviderIds.has(track.provider_id)) {
        return false;
      }

      if (seenProviderIds.has(track.provider_id)) {
        return false;
      }

      seenProviderIds.add(track.provider_id);
      return isUsableForSource(track, source);
    })
    .map((track) => {
      const baseTier = getStarterCandidateTier(track);
      const tier = source === "deep-cut" ? "deep-cut" : baseTier;
      const score = getCandidateScore(track, tier);

      return {
        ...track,
        candidate_id: `${source}:${track.provider_id}`,
        source,
        source_label: sourceLabel,
        seed_label: seedLabel,
        tier,
        reason: getCandidateReason({ source, seedLabel, tier }),
        score,
        entity_id: null,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
