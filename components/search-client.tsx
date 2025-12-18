"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeezerTrack } from "@/lib/deezer"

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function SearchClient() {
  const router = useRouter()
  const sp = useSearchParams()

  // URL -> state
  const initialQ = sp.get("q") ?? ""
  const [q, setQ] = React.useState(initialQ)

  const debouncedQ = useDebouncedValue(q.trim(), 350)

  const [tracks, setTracks] = React.useState<DeezerTrack[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Mantener URL en sync
  React.useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    router.replace(`/search?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  // Fetch (con cancelación)
  React.useEffect(() => {
    if (!debouncedQ) {
      setTracks([])
      setError(null)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetch(`/api/deezer/search?q=${encodeURIComponent(debouncedQ)}&limit=12`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Search failed")
        setTracks(json.data ?? [])
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setTracks([])
          setError(err.message)
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [debouncedQ])

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tracks…"
          className="h-11 rounded-xl pl-10"
          onKeyDown={(e) => {
            if (e.key === "Enter" && tracks.length > 0) {
              router.push(`/track/${tracks[0].id}`)
            }
          }}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* States */}
      {q.trim().length === 0 ? (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          Start typing to search.
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border p-6 text-sm text-red-500">
          {error}
        </div>
      ) : !isLoading && tracks.length === 0 ? (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          No results.
        </div>
      ) : (
        <ul className="space-y-2">
          {tracks.map((t) => (
            <li key={t.id}>
              <Link
                href={`/track/${t.id}`}
                prefetch
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border p-3",
                  "hover:bg-muted transition-colors"
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

                <span className="text-xs text-muted-foreground">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
