import {
  CANVAS_LIMIT,
  MEMORY_TTL,
  evaluateCandidate,
  seedKey,
  type DiscoveryCandidate,
  type DiscoveryVisit,
} from "./canvas";
import type { DiscoverySeed } from "./seed";

export type CandidateFeatures = {
  albumId?: string;
  tags?: readonly string[];
};

export type RankingFixture = {
  id: string;
  provenance: "synthetic" | "public-snapshot";
  seed: DiscoverySeed;
  candidates: readonly DiscoveryCandidate[];
  memory: readonly DiscoveryVisit[];
  now: number;
  variation: string;
  features: Readonly<Record<string, CandidateFeatures>>;
};

export function artistIdentity(seed: DiscoverySeed) {
  const providerId = seed.type === "artist"
    ? seed.provider_id
    : seed.artist_provider_id;
  if (providerId) return `deezer:artist:${providerId}`;
  const name = (seed.type === "artist" ? seed.title : seed.artist_name)
    ?.trim().toLowerCase();
  return name ? `name:${name}` : null;
}

function coverIdentity(candidate: DiscoverySeed) {
  return candidate.cover_url?.split("?")[0] || null;
}

export function redundancyEvidence(
  a: DiscoveryCandidate,
  b: DiscoveryCandidate,
  features: RankingFixture["features"],
) {
  const artistA = artistIdentity(a.seed);
  const artistB = artistIdentity(b.seed);
  const featuresA = features[seedKey(a.seed)];
  const featuresB = features[seedKey(b.seed)];
  const tagsA = new Set(featuresA?.tags ?? []);
  const tagsB = new Set(featuresB?.tags ?? []);
  const hasArtist = Boolean(artistA && artistB &&
    artistA.startsWith("name:") === artistB.startsWith("name:"));
  const hasAlbum = Boolean(featuresA?.albumId && featuresB?.albumId);
  const hasTags = tagsA.size > 0 && tagsB.size > 0;
  const intersection = [...tagsA].filter((tag) => tagsB.has(tag)).length;
  const union = new Set([...tagsA, ...tagsB]).size;
  return {
    // Zero means no evidenced redundancy, not known musical dissimilarity.
    value: Math.max(
      hasArtist && artistA === artistB ? 1 : 0,
      hasAlbum && featuresA.albumId === featuresB.albumId ? 0.8 : 0,
      hasTags ? 0.5 * intersection / union : 0,
    ),
    known: hasArtist || hasAlbum || hasTags,
  };
}

function lexical(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function candidateOrder(a: DiscoveryCandidate, b: DiscoveryCandidate) {
  return lexical(seedKey(a.seed), seedKey(b.seed)) ||
    lexical(a.lane, b.lane) ||
    lexical(a.seed.cover_url ?? "", b.seed.cover_url ?? "") ||
    lexical(a.seed.title, b.seed.title);
}

export function scoredCandidates(fixture: RankingFixture) {
  const context = {
    memory: [...fixture.memory],
    now: fixture.now,
    variation: fixture.variation,
  };
  const rows = fixture.candidates.map((candidate) => ({
    candidate,
    rawRelevance: evaluateCandidate({
      seed: fixture.seed,
      candidate,
      context,
    }),
  })).filter((row) => Number.isFinite(row.rawRelevance));
  rows.sort((a, b) => b.rawRelevance - a.rawRelevance ||
    candidateOrder(a.candidate, b.candidate));
  const seen = new Set<string>();
  const unique = rows.filter(({ candidate }) => {
    const key = seedKey(candidate.seed);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const min = Math.min(...unique.map((row) => row.rawRelevance));
  const max = Math.max(...unique.map((row) => row.rawRelevance));
  return unique.map((row) => ({
    ...row,
    relevance: max === min ? 1 : (row.rawRelevance - min) / (max - min),
  }));
}

/** Experimental kernel: private preview lab and mechanical tests only. */
export function rankMmr(
  fixture: RankingFixture,
  { lambda = 0.7, limit = 6 }: { lambda?: number; limit?: number } = {},
) {
  if (!Number.isFinite(lambda) || lambda < 0 || lambda > 1)
    throw new RangeError("lambda must be between zero and one");
  if (!Number.isInteger(limit) || limit < 0 || limit > CANVAS_LIMIT)
    throw new RangeError(`limit must be an integer from zero to ${CANVAS_LIMIT}`);
  if (limit === 0) return [];

  const remaining = scoredCandidates(fixture).map((row) => ({
    ...row,
    maxRedundancy: 0,
  }));
  const selected: DiscoveryCandidate[] = [];
  const covers = new Set([coverIdentity(fixture.seed)]);
  const artists = new Map<string, number>();

  while (remaining.length && selected.length < limit) {
    let best = -1;
    let bestScore = -Infinity;
    for (let index = 0; index < remaining.length; index++) {
      const row = remaining[index];
      const artist = artistIdentity(row.candidate.seed);
      if (covers.has(coverIdentity(row.candidate.seed)) ||
          (artist && (artists.get(artist) ?? 0) >= 2)) continue;
      const score = lambda * row.relevance -
        (1 - lambda) * row.maxRedundancy;
      const previous = remaining[best];
      if (score > bestScore ||
          (score === bestScore && previous &&
            (row.relevance > previous.relevance ||
              (row.relevance === previous.relevance &&
                candidateOrder(row.candidate, previous.candidate) < 0)))) {
        best = index;
        bestScore = score;
      }
    }
    if (best < 0) break;
    const [{ candidate }] = remaining.splice(best, 1);
    selected.push(candidate);
    covers.add(coverIdentity(candidate.seed));
    const artist = artistIdentity(candidate.seed);
    if (artist) artists.set(artist, (artists.get(artist) ?? 0) + 1);
    if (lambda < 1) {
      for (const row of remaining) {
        row.maxRedundancy = Math.max(
          row.maxRedundancy,
          redundancyEvidence(candidate, row.candidate, fixture.features).value,
        );
      }
    }
  }
  return selected;
}

export function selectionProxies(
  fixture: RankingFixture,
  selected: readonly DiscoveryCandidate[],
) {
  const scores = new Map(scoredCandidates(fixture)
    .map(({ candidate, relevance }) => [seedKey(candidate.seed), relevance]));
  const artists = selected.map((candidate) => artistIdentity(candidate.seed));
  const visited = new Set(fixture.memory
    .filter((visit) => fixture.now - visit.lastOpened < MEMORY_TTL)
    .map((visit) => visit.key));
  let pairs = 0;
  let knownPairs = 0;
  let redundancy = 0;
  for (let a = 0; a < selected.length; a++) {
    for (let b = a + 1; b < selected.length; b++) {
      const evidence = redundancyEvidence(selected[a], selected[b], fixture.features);
      pairs++;
      if (evidence.known) {
        knownPairs++;
        redundancy += evidence.value;
      }
    }
  }
  return {
    count: selected.length,
    meanNormalizedBaseRelevance: selected.length
      ? selected.reduce((sum, candidate) => sum + (scores.get(seedKey(candidate.seed)) ?? 0), 0) / selected.length
      : null,
    distinctKnownArtists: new Set(artists.filter(Boolean)).size,
    artistMetadataCoverage: selected.length
      ? artists.filter(Boolean).length / selected.length : null,
    distinctArtwork: new Set(selected.map((item) => coverIdentity(item.seed))).size,
    distinctLanes: new Set(selected.map((item) => item.lane)).size,
    unseenShare: selected.length
      ? selected.filter((item) => !visited.has(seedKey(item.seed))).length / selected.length : null,
    distinctTags: new Set(selected.flatMap((item) => fixture.features[seedKey(item.seed)]?.tags ?? [])).size,
    knownPairCoverage: pairs ? knownPairs / pairs : null,
    meanKnownPairRedundancy: knownPairs ? redundancy / knownPairs : null,
  };
}
