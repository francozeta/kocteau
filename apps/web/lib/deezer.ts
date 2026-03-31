export type DeezerTrackResult = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
};

type DeezerTrackApiItem = {
  id: number | string;
  title: string;
  link?: string | null;
  artist?: {
    name?: string | null;
  } | null;
  album?: {
    cover_medium?: string | null;
    cover?: string | null;
  } | null;
};

type DeezerSearchResponse = {
  data?: DeezerTrackApiItem[];
};

function mapDeezerTrack(item: DeezerTrackApiItem): DeezerTrackResult {
  return {
    provider: "deezer",
    provider_id: String(item.id),
    type: "track",
    title: item.title,
    artist_name: item.artist?.name ?? null,
    cover_url: item.album?.cover_medium ?? item.album?.cover ?? null,
    deezer_url: item.link ?? null,
  };
}

export async function searchDeezerTracks(query: string, limit = 12): Promise<DeezerTrackResult[]> {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error("Deezer request failed");
  }

  const json = (await response.json()) as DeezerSearchResponse;
  return (json.data ?? []).map(mapDeezerTrack);
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
