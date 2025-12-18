import Link from "next/link"
import { Calendar, Disc3, ExternalLink, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DeezerAlbum } from "@/lib/deezer"

interface AlbumHeaderProps {
  album: DeezerAlbum
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} min`
}

export function AlbumHeader({ album }: AlbumHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-5">
      {/* Album Cover */}
      <div className="flex-shrink-0 mx-auto md:mx-0">
        <img
          src={album.cover_big || album.cover_xl || album.cover_medium || "/placeholder.svg"}
          alt={album.title}
          className="w-48 h-48 md:w-44 md:h-44 lg:w-52 lg:h-52 rounded-xl object-cover shadow-lg"
        />
      </div>

      {/* Album Info */}
      <div className="flex-1 flex flex-col justify-center gap-3 min-w-0 text-center md:text-left">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Album</div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-balance leading-tight mb-2">{album.title}</h1>
          <Link
            href={`/artist/${album.artist.id}`}
            className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors hover:underline inline-flex items-center gap-1.5"
          >
            {album.artist.name}
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(album.release_date).getFullYear()}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Disc3 className="h-4 w-4" />
            {album.nb_tracks} {album.nb_tracks === 1 ? "track" : "tracks"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatDuration(album.duration)}
          </span>
          {album.explicit_lyrics && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium">Explicit</span>
          )}
        </div>

        {album.label && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Label:</span> {album.label}
          </div>
        )}

        <div className="flex justify-center md:justify-start gap-2 mt-1">
          <Button asChild variant="outline" size="sm" className="gap-2 bg-transparent">
            <a href={`https://www.deezer.com/album/${album.id}`} target="_blank" rel="noopener noreferrer">
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
