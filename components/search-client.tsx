"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Music, Disc, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeezerTrack, DeezerAlbum, DeezerArtist } from "@/lib/deezer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

type SearchType = "all" | "track" | "album" | "artist"

interface SearchResult {
  tracks: DeezerTrack[]
  albums: DeezerAlbum[]
  artists: DeezerArtist[]
}

export default function SearchClient() {
  const router = useRouter()
  const sp = useSearchParams()

  const initialQ = sp.get("q") ?? ""
  const initialType = (sp.get("type") ?? "all") as SearchType

  const [q, setQ] = React.useState(initialQ)
  const [type, setType] = React.useState<SearchType>(initialType)

  const debouncedQ = useDebouncedValue(q.trim(), 350)

  const [results, setResults] = React.useState<SearchResult>({
    tracks: [],
    albums: [],
    artists: [],
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (type !== "all") params.set("type", type)
    router.replace(`/search?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type])

  React.useEffect(() => {
    if (!debouncedQ) {
      setResults({ tracks: [], albums: [], artists: [] })
      setError(null)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetch(`/api/deezer/search?q=${encodeURIComponent(debouncedQ)}&type=${type}&limit=12`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Search failed")
        setResults(json.data ?? { tracks: [], albums: [], artists: [] })
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setResults({ tracks: [], albums: [], artists: [] })
          setError(err.message)
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [debouncedQ, type])

  const totalResults = results.tracks.length + results.albums.length + results.artists.length

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tracks, albums, artists…"
          className="h-11 rounded-xl pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <Tabs value={type} onValueChange={(v) => setType(v as SearchType)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="track">Tracks</TabsTrigger>
          <TabsTrigger value="album">Albums</TabsTrigger>
          <TabsTrigger value="artist">Artists</TabsTrigger>
        </TabsList>

        {/* States */}
        {q.trim().length === 0 ? (
          <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground mt-4">
            Start typing to search.
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border p-6 text-sm text-red-500 mt-4">{error}</div>
        ) : !isLoading && totalResults === 0 ? (
          <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground mt-4">No results.</div>
        ) : (
          <>
            {/* All Tab */}
            <TabsContent value="all" className="space-y-6 mt-4">
              {results.tracks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Tracks
                  </h3>
                  <TrackList tracks={results.tracks} />
                </div>
              )}
              {results.albums.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Disc className="h-4 w-4" />
                    Albums
                  </h3>
                  <AlbumList albums={results.albums} />
                </div>
              )}
              {results.artists.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Artists
                  </h3>
                  <ArtistList artists={results.artists} />
                </div>
              )}
            </TabsContent>

            {/* Track Tab */}
            <TabsContent value="track" className="mt-4">
              <TrackList tracks={results.tracks} />
            </TabsContent>

            {/* Album Tab */}
            <TabsContent value="album" className="mt-4">
              <AlbumList albums={results.albums} />
            </TabsContent>

            {/* Artist Tab */}
            <TabsContent value="artist" className="mt-4">
              <ArtistList artists={results.artists} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}

function TrackList({ tracks }: { tracks: DeezerTrack[] }) {
  if (tracks.length === 0) return null
  return (
    <ul className="space-y-2">
      {tracks.map((t) => (
        <li key={t.id}>
          <Link
            href={`/track/${t.id}`}
            prefetch
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border p-3",
              "hover:bg-muted transition-colors",
            )}
          >
            <img
              src={t.album.cover_small || "/placeholder.svg"}
              alt={t.album.title}
              className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {t.artist.name} · {t.album.title}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function AlbumList({ albums }: { albums: DeezerAlbum[] }) {
  if (albums.length === 0) return null
  return (
    <ul className="space-y-2">
      {albums.map((a) => (
        <li key={a.id}>
          <Link
            href={`/album/${a.id}`}
            prefetch
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border p-3",
              "hover:bg-muted transition-colors",
            )}
          >
            <img
              src={a.cover_small || "/placeholder.svg"}
              alt={a.title}
              className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.title}</p>
              <p className="truncate text-sm text-muted-foreground">{a.artist.name}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ArtistList({ artists }: { artists: DeezerArtist[] }) {
  if (artists.length === 0) return null
  return (
    <ul className="space-y-2">
      {artists.map((a) => (
        <li key={a.id}>
          <Link
            href={`/artist/${a.id}`}
            prefetch
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border p-3",
              "hover:bg-muted transition-colors",
            )}
          >
            <img
              src={a.picture_small || "/placeholder.svg"}
              alt={a.name}
              className="h-12 w-12 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.name}</p>
              <p className="truncate text-sm text-muted-foreground">{a.nb_fan.toLocaleString()} fans</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
