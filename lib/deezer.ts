export interface DeezerTrack {
  id: number
  title: string
  title_short: string
  duration: number
  rank: number
  explicit_lyrics: boolean
  preview: string
  artist: {
    id: number
    name: string
    picture: string
    picture_small: string
    picture_medium: string
  }
  album: {
    id: number
    title: string
    cover: string
    cover_small: string
    cover_medium: string
    cover_big: string
  }
}

export interface DeezerAlbum {
  id: number
  title: string
  cover: string
  cover_small: string
  cover_medium: string
  cover_big: string
  cover_xl: string
  genre_id: number
  genres: {
    data: Array<{ id: number; name: string }>
  }
  label: string
  nb_tracks: number
  duration: number
  fans: number
  release_date: string
  record_type: string
  explicit_lyrics: boolean
  artist: {
    id: number
    name: string
    picture: string
    picture_small: string
    picture_medium: string
    picture_big: string
  }
  tracks: {
    data: DeezerTrack[]
  }
}

export interface DeezerArtist {
  id: number
  name: string
  picture: string
  picture_small: string
  picture_medium: string
  picture_big: string
  picture_xl: string
  nb_album: number
  nb_fan: number
}

export interface DeezerSearchResponse {
  data: DeezerTrack[]
  total: number
  next?: string
}

export interface DeezerChart {
  tracks: {
    data: DeezerTrack[]
  }
}

const DEEZER_API_BASE = "https://api.deezer.com"

export async function searchTracks(query: string, limit = 10): Promise<DeezerTrack[]> {
  if (!query.trim()) return []

  const res = await fetch(`${DEEZER_API_BASE}/search/track?q=${encodeURIComponent(query)}&limit=${limit}`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) return []

  const data: DeezerSearchResponse = await res.json()
  return data.data || []
}

export async function getChartTracks(limit = 10): Promise<DeezerTrack[]> {
  const res = await fetch(`${DEEZER_API_BASE}/chart/0/tracks?limit=${limit}`, { next: { revalidate: 300 } })

  if (!res.ok) return []

  const data = await res.json()
  return data.data || []
}

export async function getTrack(id: number): Promise<DeezerTrack | null> {
  const res = await fetch(`${DEEZER_API_BASE}/track/${id}`, { next: { revalidate: 3600 } })

  if (!res.ok) return null

  return res.json()
}

export async function getAlbum(id: number): Promise<DeezerAlbum | null> {
  const res = await fetch(`${DEEZER_API_BASE}/album/${id}`, { next: { revalidate: 3600 } })

  if (!res.ok) return null

  return res.json()
}

export async function getArtist(id: number): Promise<DeezerArtist | null> {
  const res = await fetch(`${DEEZER_API_BASE}/artist/${id}`, { next: { revalidate: 3600 } })

  if (!res.ok) return null

  return res.json()
}

export async function getArtistTopTracks(artistId: number, limit = 10): Promise<DeezerTrack[]> {
  const res = await fetch(`${DEEZER_API_BASE}/artist/${artistId}/top?limit=${limit}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) return []

  const data = await res.json()
  return data.data || []
}
