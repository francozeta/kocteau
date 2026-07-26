import "server-only";

const musicBrainzApiUrl = "https://musicbrainz.org/ws/2";
const musicBrainzUserAgent = "Kocteau/0.3.8 (https://kocteau.com)";
const musicBrainzTimeoutMs = 10_000;
const minimumMatchScore = 85;

type MusicBrainzTag = {
  count?: number;
  name?: string;
};

type MusicBrainzLifeSpan = {
  begin?: string;
  end?: string;
};

type MusicBrainzArtistSearchResult = {
  artists?: Array<{
    id: string;
    name: string;
    score?: number;
    type?: string;
    country?: string;
    disambiguation?: string;
    "life-span"?: MusicBrainzLifeSpan;
    tags?: MusicBrainzTag[];
  }>;
};

type MusicBrainzRecordingSearchResult = {
  recordings?: Array<{
    id: string;
    title: string;
    score?: number;
    disambiguation?: string;
    "first-release-date"?: string;
    tags?: MusicBrainzTag[];
  }>;
};

type MusicBrainzReleaseGroupSearchResult = {
  "release-groups"?: Array<{
    id: string;
    title: string;
    score?: number;
    disambiguation?: string;
    "first-release-date"?: string;
    "primary-type"?: string;
    "secondary-types"?: string[];
    tags?: MusicBrainzTag[];
  }>;
};

export type MusicBrainzArtistMatch = {
  id: string;
  score: number;
  type: string | null;
  countryCode: string | null;
  disambiguation: string | null;
  lifeSpanBegin: string | null;
  lifeSpanEnd: string | null;
  genres: string[];
};

export type MusicBrainzEntityMatch = {
  id: string;
  score: number;
  disambiguation: string | null;
  firstReleaseDate: string | null;
  recordType: string | null;
  genres: string[];
};

export class MusicBrainzRequestError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "MusicBrainzRequestError";
    this.status = status;
  }
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeLucene(value: string) {
  return value.replace(/([+\-&|!(){}\[\]^"~*?:\\/])/g, "\\$1");
}

function getGenres(tags: MusicBrainzTag[] | undefined) {
  return [...(tags ?? [])]
    .filter((tag) => Boolean(tag.name?.trim()))
    .sort((left, right) => (right.count ?? 0) - (left.count ?? 0))
    .slice(0, 8)
    .map((tag) => tag.name!.trim().toLowerCase());
}

function selectConfidentMatch<T extends { score?: number; title?: string; name?: string }>(
  results: T[] | undefined,
  expectedName: string,
) {
  const expected = normalizeText(expectedName);
  const ranked = [...(results ?? [])].sort(
    (left, right) => (right.score ?? 0) - (left.score ?? 0),
  );

  return (
    ranked.find((candidate) => {
      const score = candidate.score ?? 0;
      const candidateName = normalizeText(candidate.title ?? candidate.name ?? "");
      return score >= minimumMatchScore && candidateName === expected;
    }) ?? null
  );
}

async function fetchMusicBrainz<T>(resource: string, query: string) {
  const params = new URLSearchParams({
    query,
    fmt: "json",
    limit: "5",
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), musicBrainzTimeoutMs);

  try {
    const response = await fetch(`${musicBrainzApiUrl}/${resource}?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": musicBrainzUserAgent,
      },
      next: { revalidate: 30 * 24 * 60 * 60 },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new MusicBrainzRequestError(
        `MusicBrainz ${resource} request failed.`,
        response.status,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof MusicBrainzRequestError) {
      throw error;
    }

    throw new MusicBrainzRequestError(
      `MusicBrainz ${resource} request failed.`,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function findMusicBrainzArtist(
  name: string,
): Promise<MusicBrainzArtistMatch | null> {
  const query = `artist:"${escapeLucene(name)}"`;
  const result = await fetchMusicBrainz<MusicBrainzArtistSearchResult>(
    "artist",
    query,
  );
  const match = selectConfidentMatch(result.artists, name);

  if (!match) {
    return null;
  }

  return {
    id: match.id,
    score: match.score ?? 0,
    type: match.type ?? null,
    countryCode: match.country ?? null,
    disambiguation: match.disambiguation ?? null,
    lifeSpanBegin: match["life-span"]?.begin ?? null,
    lifeSpanEnd: match["life-span"]?.end ?? null,
    genres: getGenres(match.tags),
  };
}

export async function findMusicBrainzRecording(
  title: string,
  artistName: string | null,
): Promise<MusicBrainzEntityMatch | null> {
  const artistQuery = artistName
    ? ` AND artist:"${escapeLucene(artistName)}"`
    : "";
  const query = `recording:"${escapeLucene(title)}"${artistQuery}`;
  const result = await fetchMusicBrainz<MusicBrainzRecordingSearchResult>(
    "recording",
    query,
  );
  const match = selectConfidentMatch(result.recordings, title);

  if (!match) {
    return null;
  }

  return {
    id: match.id,
    score: match.score ?? 0,
    disambiguation: match.disambiguation ?? null,
    firstReleaseDate: match["first-release-date"] ?? null,
    recordType: "recording",
    genres: getGenres(match.tags),
  };
}

export async function findMusicBrainzReleaseGroup(
  title: string,
  artistName: string | null,
): Promise<MusicBrainzEntityMatch | null> {
  const artistQuery = artistName
    ? ` AND artist:"${escapeLucene(artistName)}"`
    : "";
  const query = `releasegroup:"${escapeLucene(title)}"${artistQuery}`;
  const result = await fetchMusicBrainz<MusicBrainzReleaseGroupSearchResult>(
    "release-group",
    query,
  );
  const match = selectConfidentMatch(result["release-groups"], title);

  if (!match) {
    return null;
  }

  return {
    id: match.id,
    score: match.score ?? 0,
    disambiguation: match.disambiguation ?? null,
    firstReleaseDate: match["first-release-date"] ?? null,
    recordType:
      [match["primary-type"], ...(match["secondary-types"] ?? [])]
        .filter(Boolean)
        .join(" / ") || null,
    genres: getGenres(match.tags),
  };
}
