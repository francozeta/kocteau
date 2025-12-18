"use client"

import Link from "next/link"
import { Clock, Play } from "lucide-react"
import type { DeezerTrack } from "@/lib/deezer"

interface ArtistTopTracksProps {
  tracks: DeezerTrack[]
  artistName: string
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function ArtistTopTracks({ tracks, artistName }: ArtistTopTracksProps) {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold">Top Tracks</h2>
        <p className="text-muted-foreground">No tracks available for this artist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold">Top Tracks</h2>

      <div className="space-y-1">
        {tracks.map((track, index) => (
          <Link
            key={track.id}
            href={`/track/${track.id}`}
            className="flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-accent transition-colors group"
          >
            <div className="w-8 text-center text-sm text-muted-foreground group-hover:text-foreground flex-shrink-0">
              <span className="group-hover:hidden">{index + 1}</span>
              <Play className="h-4 w-4 hidden group-hover:inline-block fill-current" />
            </div>

            <div className="flex-shrink-0">
              <img
                src={track.album.cover_small || track.album.cover || "/placeholder.svg"}
                alt={track.album.title}
                className="w-10 h-10 rounded"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm md:text-base truncate group-hover:text-foreground">{track.title}</div>
              <Link
                href={`/album/${track.album.id}`}
                className="text-xs md:text-sm text-muted-foreground hover:underline truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {track.album.title}
              </Link>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-shrink-0">
              <Clock className="h-3.5 w-3.5 hidden sm:inline-block" />
              <span>{formatDuration(track.duration)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
