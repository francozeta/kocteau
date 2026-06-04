export type KocteauSearchSource = "local" | "starter" | "artist-match" | "deezer";

export type KocteauTrackSearchCandidate = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
  source: KocteauSearchSource;
  source_index?: number;
  rank?: number | null;
};

export type KocteauTrackSearchResult = KocteauTrackSearchCandidate & {
  score: number;
  source_label: string;
};

const sourceScore: Record<KocteauSearchSource, number> = {
  local: 320,
  starter: 260,
  "artist-match": 150,
  deezer: 0,
};

const sourceLabel: Record<KocteauSearchSource, string> = {
  local: "Kocteau",
  starter: "Starter pick",
  "artist-match": "Artist match",
  deezer: "Deezer",
};

export function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function hasWordMatch(value: string, query: string) {
  if (!value || !query) return false;

  return value.split(" ").includes(query);
}

function getTokenOverlapScore(value: string, query: string) {
  if (!value || !query) return 0;

  const valueTokens = new Set(value.split(" ").filter(Boolean));
  const queryTokens = query.split(" ").filter((token) => token.length > 1);
  const matches = queryTokens.filter((token) => valueTokens.has(token)).length;

  return matches * 24;
}

function getRankTieBreaker(rank: number | null | undefined) {
  if (!rank || rank <= 0) return 0;

  return Math.min(35, Math.log10(rank) * 6);
}

function getSourcePriority(source: KocteauSearchSource) {
  if (source === "local") return 4;
  if (source === "starter") return 3;
  if (source === "artist-match") return 2;
  return 1;
}

function getCandidateIdentity(candidate: KocteauTrackSearchCandidate) {
  return `${candidate.provider}:${candidate.type}:${candidate.provider_id}`;
}

function mergeDuplicateCandidate(
  existing: KocteauTrackSearchCandidate,
  incoming: KocteauTrackSearchCandidate,
) {
  const existingPriority = getSourcePriority(existing.source) + (existing.entity_id ? 1 : 0);
  const incomingPriority = getSourcePriority(incoming.source) + (incoming.entity_id ? 1 : 0);
  const winner = incomingPriority > existingPriority ? incoming : existing;
  const fallback = winner === incoming ? existing : incoming;

  return {
    ...winner,
    entity_id: winner.entity_id ?? fallback.entity_id ?? null,
    cover_url: winner.cover_url ?? fallback.cover_url,
    deezer_url: winner.deezer_url ?? fallback.deezer_url,
    rank: winner.rank ?? fallback.rank ?? null,
    source_index: Math.min(
      winner.source_index ?? Number.MAX_SAFE_INTEGER,
      fallback.source_index ?? Number.MAX_SAFE_INTEGER,
    ),
  };
}

export function getKocteauSearchScore(
  query: string,
  candidate: Pick<
    KocteauTrackSearchCandidate,
    "title" | "artist_name" | "source" | "entity_id" | "rank"
  >,
) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(candidate.title);
  const normalizedArtist = normalizeSearchText(candidate.artist_name);

  if (!normalizedQuery) return 0;

  let score = sourceScore[candidate.source];

  if (candidate.entity_id) {
    score += 45;
  }

  if (normalizedArtist === normalizedQuery) {
    score += 650;
  } else if (normalizedArtist.startsWith(normalizedQuery)) {
    score += 430;
  } else if (hasWordMatch(normalizedArtist, normalizedQuery)) {
    score += 320;
  } else if (normalizedArtist.includes(normalizedQuery)) {
    score += 180;
  }

  if (normalizedTitle === normalizedQuery) {
    score += 360;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 250;
  } else if (hasWordMatch(normalizedTitle, normalizedQuery)) {
    score += 180;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 120;
  }

  score += getTokenOverlapScore(normalizedArtist, normalizedQuery);
  score += getTokenOverlapScore(normalizedTitle, normalizedQuery);
  score += getRankTieBreaker(candidate.rank);

  return score;
}

export function isStrongArtistSearchMatch(query: string, artistName: string | null | undefined) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedArtist = normalizeSearchText(artistName);

  if (!normalizedQuery || !normalizedArtist) return false;
  if (normalizedArtist === normalizedQuery) return true;

  return normalizedQuery.length >= 4 && normalizedArtist.startsWith(normalizedQuery);
}

export function rankKocteauTrackSearchResults({
  query,
  candidates,
  limit = 24,
}: {
  query: string;
  candidates: KocteauTrackSearchCandidate[];
  limit?: number;
}): KocteauTrackSearchResult[] {
  const deduped = new Map<string, KocteauTrackSearchCandidate>();

  for (const candidate of candidates) {
    const key = getCandidateIdentity(candidate);
    const existing = deduped.get(key);

    deduped.set(key, existing ? mergeDuplicateCandidate(existing, candidate) : candidate);
  }

  return Array.from(deduped.values())
    .map((candidate) => ({
      ...candidate,
      score: getKocteauSearchScore(query, candidate),
      source_label: sourceLabel[candidate.source],
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (getSourcePriority(b.source) !== getSourcePriority(a.source)) {
        return getSourcePriority(b.source) - getSourcePriority(a.source);
      }

      return (a.source_index ?? Number.MAX_SAFE_INTEGER) - (b.source_index ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, limit);
}
