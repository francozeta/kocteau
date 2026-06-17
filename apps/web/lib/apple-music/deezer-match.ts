import {
  getDeezerErrorDetails,
  searchDeezerTracks,
  type DeezerTrackResult,
} from "../deezer";
import type { AppleMusicPlaylistTrack } from "./types";

export type AppleMusicDeezerMatch = {
  track: AppleMusicPlaylistTrack;
  match: DeezerTrackResult | null;
  score: number;
  titleScore: number;
  artistScore: number;
  releaseDate: string | null;
  eraSlug: string | null;
  rejectedCandidates: Array<{
    providerId: string;
    title: string;
    artistName: string | null;
    score: number;
  }>;
  error: {
    status: number | null;
    message: string;
  } | null;
};

export type MatchApplePlaylistTrackOptions = {
  limit?: number;
  minScore?: number;
};

const defaultMatchLimit = 5;
const defaultMinScore = 0.78;

function normalizeMusicText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(feat|ft|featuring)\b\.?/g, " ")
    .replace(/\([^)]*(remaster|edit|version|mix|mono|stereo|live)[^)]*\)/g, " ")
    .replace(/\[[^\]]*(remaster|edit|version|mix|mono|stereo|live)[^\]]*\]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenSet(value: string) {
  return new Set(value.split(" ").filter((token) => token.length > 1));
}

function scoreTextMatch(left: string | null | undefined, right: string | null | undefined) {
  const normalizedLeft = normalizeMusicText(left);
  const normalizedRight = normalizeMusicText(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  if (
    normalizedLeft.length > 4 &&
    normalizedRight.length > 4 &&
    (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft))
  ) {
    return 0.9;
  }

  const leftTokens = tokenSet(normalizedLeft);
  const rightTokens = tokenSet(normalizedRight);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  });

  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

export function scoreAppleDeezerTrackMatch(
  track: AppleMusicPlaylistTrack,
  candidate: DeezerTrackResult,
) {
  const titleScore = scoreTextMatch(track.title, candidate.title);
  const artistScore = scoreTextMatch(track.artist, candidate.artist_name);
  const score = titleScore * 0.65 + artistScore * 0.35;

  return {
    score,
    titleScore,
    artistScore,
  };
}

export async function matchApplePlaylistTrackToDeezer(
  track: AppleMusicPlaylistTrack,
  options: MatchApplePlaylistTrackOptions = {},
): Promise<AppleMusicDeezerMatch> {
  const limit = options.limit ?? defaultMatchLimit;
  const minScore = options.minScore ?? defaultMinScore;
  const query = [track.title, track.artist].filter(Boolean).join(" ");

  try {
    const candidates = await searchDeezerTracks(query, limit);
    const ranked = candidates
      .map((candidate) => ({
        candidate,
        ...scoreAppleDeezerTrackMatch(track, candidate),
      }))
      .sort((left, right) => right.score - left.score);
    const best = ranked[0];
    const rejectedCandidates = ranked.slice(0, 3).map((item) => ({
      providerId: item.candidate.provider_id,
      title: item.candidate.title,
      artistName: item.candidate.artist_name,
      score: Number(item.score.toFixed(3)),
    }));

    if (!best || best.score < minScore) {
      return {
        track,
        match: null,
        score: best?.score ?? 0,
        titleScore: best?.titleScore ?? 0,
        artistScore: best?.artistScore ?? 0,
        releaseDate: null,
        eraSlug: null,
        rejectedCandidates,
        error: null,
      };
    }

    return {
      track,
      match: best.candidate,
      score: best.score,
      titleScore: best.titleScore,
      artistScore: best.artistScore,
      releaseDate: best.candidate.release_date ?? null,
      eraSlug: null,
      rejectedCandidates,
      error: null,
    };
  } catch (error) {
    return {
      track,
      match: null,
      score: 0,
      titleScore: 0,
      artistScore: 0,
      releaseDate: null,
      eraSlug: null,
      rejectedCandidates: [],
      error: getDeezerErrorDetails(error),
    };
  }
}
