import type { AppleMusicPlaylistUrlParts } from "./types";

const appleMusicRequestTimeoutMs = 10_000;
const appleMusicUserAgent = "KocteauAppleMusicImporter/1.0";

export class AppleMusicFetchError extends Error {
  status: number | null;
  cause?: unknown;

  constructor(message: string, status: number | null = null, cause?: unknown) {
    super(message);
    this.name = "AppleMusicFetchError";
    this.status = status;
    this.cause = cause;
  }
}

type FetchJsonOptions = {
  token: string;
  url: string;
};

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), appleMusicRequestTimeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchAppleMusicPlaylistHtml(url: string) {
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": appleMusicUserAgent,
      },
    });

    if (!response.ok) {
      throw new AppleMusicFetchError(
        "Apple Music public playlist page request failed.",
        response.status,
      );
    }

    return {
      html: await response.text(),
      finalUrl: response.url,
      status: response.status,
    };
  } catch (error) {
    if (error instanceof AppleMusicFetchError) {
      throw error;
    }

    throw new AppleMusicFetchError(
      "Apple Music public playlist page request failed.",
      null,
      error,
    );
  }
}

async function fetchAppleMusicApiJson<T>({ token, url }: FetchJsonOptions): Promise<T> {
  const response = await fetchWithTimeout(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": appleMusicUserAgent,
    },
  });

  if (!response.ok) {
    throw new AppleMusicFetchError("Apple Music API request failed.", response.status);
  }

  return (await response.json()) as T;
}

function resolveAppleMusicApiUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http")) {
    return pathOrUrl;
  }

  return new URL(pathOrUrl, "https://api.music.apple.com").toString();
}

export type AppleMusicApiSongResource = {
  id: string;
  type: "songs";
  href?: string;
  attributes?: {
    name?: string;
    artistName?: string;
    albumName?: string;
    durationInMillis?: number;
    url?: string;
    artwork?: {
      url?: string;
      width?: number;
      height?: number;
      bgColor?: string;
      textColor1?: string;
      textColor2?: string;
    };
  };
  relationships?: {
    albums?: {
      data?: Array<{ id: string; type: string }>;
    };
    artists?: {
      data?: Array<{ id: string; type: string }>;
    };
  };
};

type AppleMusicApiPlaylistResource = {
  id: string;
  type: "playlists";
  attributes?: {
    name?: string;
    curatorName?: string;
    url?: string;
    trackCount?: number;
    artwork?: {
      url?: string;
      width?: number;
      height?: number;
      bgColor?: string;
      textColor1?: string;
      textColor2?: string;
    };
  };
  relationships?: {
    tracks?: {
      data?: AppleMusicApiSongResource[];
      next?: string;
    };
  };
};

type AppleMusicApiPlaylistResponse = {
  data?: AppleMusicApiPlaylistResource[];
};

type AppleMusicApiRelationshipResponse = {
  data?: AppleMusicApiSongResource[];
  next?: string;
};

export type AppleMusicApiPlaylistPayload = {
  playlist: AppleMusicApiPlaylistResource;
  tracks: AppleMusicApiSongResource[];
};

export async function fetchAppleMusicPlaylistFromApi(
  parts: AppleMusicPlaylistUrlParts,
  token: string,
): Promise<AppleMusicApiPlaylistPayload> {
  const endpoint = new URL(
    `https://api.music.apple.com/v1/catalog/${encodeURIComponent(parts.storefront)}/playlists/${encodeURIComponent(parts.playlistId)}`,
  );
  endpoint.searchParams.set("include", "tracks");

  const payload = await fetchAppleMusicApiJson<AppleMusicApiPlaylistResponse>({
    token,
    url: endpoint.toString(),
  });
  const playlist = payload.data?.[0];

  if (!playlist) {
    throw new AppleMusicFetchError("Apple Music API returned no playlist.");
  }

  const tracks = [...(playlist.relationships?.tracks?.data ?? [])];
  let nextUrl = playlist.relationships?.tracks?.next ?? null;

  while (nextUrl) {
    const page = await fetchAppleMusicApiJson<AppleMusicApiRelationshipResponse>({
      token,
      url: resolveAppleMusicApiUrl(nextUrl),
    });

    tracks.push(...(page.data ?? []));
    nextUrl = page.next ?? null;
  }

  return { playlist, tracks };
}
