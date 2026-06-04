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
  } | null;
};

type DeezerSearchResponse = {
  data?: DeezerTrackApiItem[];
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

type DeezerFetchOptions = {
  errorMessage: string;
  revalidate: number;
  retryDelays?: readonly number[];
};

export class DeezerRequestError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "DeezerRequestError";
    this.status = status;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

      if (attempt >= retryDelays.length) {
        break;
      }

      await sleep(retryDelays[attempt] ?? 0);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new DeezerRequestError(errorMessage);
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
  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as DeezerRelatedArtistsResponse & {
    error?: unknown;
  };

  if ("error" in json) {
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
  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as DeezerArtistAlbumsResponse & {
    error?: unknown;
  };

  if ("error" in json) {
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
  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as DeezerArtistTopTracksResponse & {
    error?: unknown;
  };

  if ("error" in json) {
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
  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as DeezerAlbumTracksResponse & {
    error?: unknown;
  };

  if ("error" in json) {
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
  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as DeezerTrackApiItem & { error?: unknown };

  if ("error" in json || !json.id || !json.title) {
    return null;
  }

  return mapDeezerTrack(json);
}
