import Link from "next/link"
import { Music2, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DeezerTrack } from "@/lib/deezer"

interface TrackHeaderProps {
  track: DeezerTrack
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function TrackHeader({ track }: TrackHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-5">
      {/* Album Cover */}
      <div className="flex-shrink-0 mx-auto md:mx-0">
        <img
          src={track.album.cover_big || track.album.cover_medium || "/placeholder.svg"}
          alt={track.album.title}
          className="w-48 h-48 md:w-44 md:h-44 lg:w-52 lg:h-52 rounded-xl object-cover shadow-lg"
        />
      </div>

      {/* Track Info */}
      <div className="flex-1 flex flex-col justify-center gap-3 min-w-0 text-center md:text-left">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-balance leading-tight mb-2">{track.title}</h1>
          <Link
            href={`/artist/${track.artist.id}`}
            className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors hover:underline inline-flex items-center gap-1.5"
          >
            {track.artist.name}
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link
            href={`/album/${track.album.id}`}
            className="hover:text-foreground transition-colors hover:underline inline-flex items-center gap-1.5"
          >
            <Music2 className="h-4 w-4" />
            <span className="truncate">{track.album.title}</span>
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatDuration(track.duration)}
          </span>
          {track.explicit_lyrics && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium">Explicit</span>
          )}
        </div>

        <div className="flex justify-center md:justify-start gap-2 mt-1">
          <Button asChild variant="outline" size="sm" className="gap-2 bg-transparent">
            <a href={`https://www.deezer.com/track/${track.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Open in Deezer</span>
              <span className="sm:hidden">Deezer</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
