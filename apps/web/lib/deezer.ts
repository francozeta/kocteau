export type DeezerTrackResult = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  artist_id: string | null;
  artist_fan_count: number | null;
  cover_url: string | null;
  deezer_url: string | null;
  release_date?: string | null;
  rank: number | null;
};

export type DeezerArtistResult = {
  provider: "deezer";
  id: string;
  name: string;
  fan_count: number | null;
  picture_url: string | null;
  deezer_url: string | null;
};

export type DeezerAlbumResult = {
  provider: "deezer";
  id: string;
  title: string;
  cover_url: string | null;
  record_type: string | null;
  release_date: string | null;
};

type DeezerTrackApiItem = {
  id: number | string;
  title: string;
  link?: string | null;
  rank?: number | null;
  artist?: {
    id?: number | string | null;
    name?: string | null;
    nb_fan?: number | null;
  } | null;
  album?: {
    cover_medium?: string | null;
    cover?: string | null;
    release_date?: string | null;
  } | null;
  release_date?: string | null;
};

type DeezerSearchResponse = {
  data?: DeezerTrackApiItem[];
  error?: unknown;
};

type DeezerArtistApiItem = {
  id: number | string;
  name?: string | null;
  nb_fan?: number | null;
  picture_medium?: string | null;
  picture?: string | null;
  link?: string | null;
};

type DeezerArtistSearchResponse = {
  data?: DeezerArtistApiItem[];
  error?: unknown;
};

type DeezerRelatedArtistsResponse = {
  data?: DeezerArtistApiItem[];
};

type DeezerArtistTopTracksResponse = {
  data?: DeezerTrackApiItem[];
};

type DeezerAlbumApiItem = {
  id: number | string;
  title?: string | null;
  cover_medium?: string | null;
  cover?: string | null;
  record_type?: string | null;
  release_date?: string | null;
};

type DeezerArtistAlbumsResponse = {
  data?: DeezerAlbumApiItem[];
};

type DeezerAlbumTracksResponse = {
  data?: DeezerTrackApiItem[];
};

type DeezerTrackMapOptions = {
  artist_id?: string | null;
  artist_name?: string | null;
  artist_fan_count?: number | null;
  cover_url?: string | null;
};

const deezerRequestTimeoutMs = 8_000;
const deezerSearchRetryDelaysMs = [250, 700] as const;
const deezerResourceRetryDelaysMs = [300] as const;

type DeezerFetchOptions = {
  errorMessage: string;
  revalidate: number;
  retryDelays?: readonly number[];
};

export class DeezerRequestError extends Error {
  status: number | null;
  cause?: unknown;

  constructor(message: string, status: number | null = null, cause?: unknown) {
    super(message);
    this.name = "DeezerRequestError";
    this.status = status;
    this.cause = cause;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryDeezerError(error: unknown) {
  if (error instanceof DeezerRequestError && error.status !== null) {
    return error.status === 429 || error.status >= 500;
  }

  return true;
}

function hasDeezerApiError(payload: { error?: unknown }) {
  return Object.prototype.hasOwnProperty.call(payload, "error");
}

export function getDeezerErrorDetails(error: unknown) {
  return {
    status: error instanceof DeezerRequestError ? error.status : null,
    message: error instanceof Error ? error.message : "Unknown Deezer error",
  };
}

async function fetchDeezerJson<T>(
  url: string,
  {
    errorMessage,
    revalidate,
    retryDelays = [],
  }: DeezerFetchOptions,
): Promise<T> {
  let lastError: unknown = null;
  const maxAttempts = retryDelays.length + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), deezerRequestTimeoutMs);

    try {
      const response = await fetch(url, {
        next: { revalidate },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new DeezerRequestError(errorMessage, response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;

      if (attempt >= retryDelays.length || !shouldRetryDeezerError(error)) {
        break;
      }

      await sleep(retryDelays[attempt] ?? 0);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError instanceof Error) {
    if (lastError instanceof DeezerRequestError) {
      throw lastError;
    }

    throw new DeezerRequestError(errorMessage, null, lastError);
  }

  throw new DeezerRequestError(errorMessage);
}

async function fetchOptionalDeezerJson<T extends { error?: unknown }>(
  url: string,
  {
    errorMessage,
    revalidate,
    scope,
  }: DeezerFetchOptions & { scope: string },
): Promise<T | null> {
  try {
    const json = await fetchDeezerJson<T>(url, {
      errorMessage,
      revalidate,
      retryDelays: deezerResourceRetryDelaysMs,
    });

    return hasDeezerApiError(json) ? null : json;
  } catch (error) {
    console.warn(`[deezer.${scope}] unavailable`, getDeezerErrorDetails(error));
    return null;
  }
}

function getOptionalNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapDeezerTrack(
  item: DeezerTrackApiItem,
  options: DeezerTrackMapOptions = {},
): DeezerTrackResult {
  return {
    provider: "deezer",
    provider_id: String(item.id),
    type: "track",
    title: item.title,
    artist_name: item.artist?.name ?? options.artist_name ?? null,
    artist_id: options.artist_id ?? (item.artist?.id ? String(item.artist.id) : null),
    artist_fan_count:
      options.artist_fan_count ?? getOptionalNumber(item.artist?.nb_fan),
    cover_url: item.album?.cover_medium ?? item.album?.cover ?? options.cover_url ?? null,
    deezer_url: item.link ?? null,
    release_date: item.release_date ?? item.album?.release_date ?? null,
    rank: getOptionalNumber(item.rank),
  };
}

export async function searchDeezerTracks(query: string, limit = 12): Promise<DeezerTrackResult[]> {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const json = await fetchDeezerJson<DeezerSearchResponse>(url, {
    errorMessage: "Deezer search request failed",
    revalidate: 60,
    retryDelays: deezerSearchRetryDelaysMs,
  });

  if (hasDeezerApiError(json)) {
    throw new DeezerRequestError("Deezer search request failed");
  }

  return (json.data ?? []).map((item) => mapDeezerTrack(item));
}

function mapDeezerArtist(item: DeezerArtistApiItem): DeezerArtistResult | null {
  if (!item.id || !item.name) {
    return null;
  }

  return {
    provider: "deezer",
    id: String(item.id),
    name: item.name,
    fan_count: getOptionalNumber(item.nb_fan),
    picture_url: item.picture_medium ?? item.picture ?? null,
    deezer_url: item.link ?? null,
  };
}

export async function searchDeezerArtists(
  query: string,
  limit = 3,
): Promise<DeezerArtistResult[]> {
  const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`;
  const json = await fetchDeezerJson<DeezerArtistSearchResponse>(url, {
    errorMessage: "Deezer artist request failed",
    revalidate: 300,
    retryDelays: deezerSearchRetryDelaysMs,
  });

  if (hasDeezerApiError(json)) {
    throw new DeezerRequestError("Deezer artist request failed");
  }

  return (json.data ?? []).flatMap((item) => {
    const artist = mapDeezerArtist(item);
    return artist ? [artist] : [];
  });
}

function mapDeezerAlbum(item: DeezerAlbumApiItem): DeezerAlbumResult | null {
  if (!item.id || !item.title) {
    return null;
  }

  return {
    provider: "deezer",
    id: String(item.id),
    title: item.title,
    cover_url: item.cover_medium ?? item.cover ?? null,
    record_type: item.record_type ?? null,
    release_date: item.release_date ?? null,
  };
}

export async function getDeezerRelatedArtists(
  artistId: string,
  limit = 8,
): Promise<DeezerArtistResult[]> {
  const url = `https://api.deezer.com/artist/${encodeURIComponent(artistId)}/related?limit=${limit}`;
  const json = await fetchOptionalDeezerJson<DeezerRelatedArtistsResponse & { error?: unknown }>(
    url,
    {
      errorMessage: "Deezer related artists request failed",
      revalidate: 300,
      scope: "related_artists",
    },
  );

  if (!json) {
    return [];
  }

  return (json.data ?? []).flatMap((item) => {
    const artist = mapDeezerArtist(item);
    return artist ? [artist] : [];
  });
}

export async function getDeezerArtistAlbums(
  artistId: string,
  limit = 8,
): Promise<DeezerAlbumResult[]> {
  const url = `https://api.deezer.com/artist/${encodeURIComponent(artistId)}/albums?limit=${limit}`;
  const json = await fetchOptionalDeezerJson<DeezerArtistAlbumsResponse & { error?: unknown }>(
    url,
    {
      errorMessage: "Deezer artist albums request failed",
      revalidate: 300,
      scope: "artist_albums",
    },
  );

  if (!json) {
    return [];
  }

  return (json.data ?? []).flatMap((item) => {
    const album = mapDeezerAlbum(item);
    return album ? [album] : [];
  });
}

export async function getDeezerArtistTopTracks(
  artist: Pick<DeezerArtistResult, "id" | "fan_count">,
  limit = 6,
): Promise<DeezerTrackResult[]> {
  const url = `https://api.deezer.com/artist/${encodeURIComponent(artist.id)}/top?limit=${limit}`;
  const json = await fetchOptionalDeezerJson<DeezerArtistTopTracksResponse & { error?: unknown }>(
    url,
    {
      errorMessage: "Deezer artist top tracks request failed",
      revalidate: 300,
      scope: "artist_top_tracks",
    },
  );

  if (!json) {
    return [];
  }

  return (json.data ?? []).map((item) =>
    mapDeezerTrack(item, {
      artist_id: artist.id,
      artist_fan_count: artist.fan_count,
    }),
  );
}

export async function getDeezerAlbumTracks(
  album: Pick<DeezerAlbumResult, "id" | "cover_url">,
  artist: Pick<DeezerArtistResult, "id" | "name" | "fan_count">,
  limit = 12,
): Promise<DeezerTrackResult[]> {
  const url = `https://api.deezer.com/album/${encodeURIComponent(album.id)}/tracks?limit=${limit}`;
  const json = await fetchOptionalDeezerJson<DeezerAlbumTracksResponse & { error?: unknown }>(
    url,
    {
      errorMessage: "Deezer album tracks request failed",
      revalidate: 300,
      scope: "album_tracks",
    },
  );

  if (!json) {
    return [];
  }

  return (json.data ?? []).map((item) =>
    mapDeezerTrack(item, {
      artist_id: artist.id,
      artist_name: artist.name,
      artist_fan_count: artist.fan_count,
      cover_url: album.cover_url,
    }),
  );
}

export async function getDeezerTrack(providerId: string): Promise<DeezerTrackResult | null> {
  const url = `https://api.deezer.com/track/${encodeURIComponent(providerId)}`;
  const json = await fetchOptionalDeezerJson<DeezerTrackApiItem & { error?: unknown }>(
    url,
    {
      errorMessage: "Deezer track request failed",
      revalidate: 300,
      scope: "track",
    },
  );

  if (!json || !json.id || !json.title) {
    return null;
  }

  return mapDeezerTrack(json);
}
