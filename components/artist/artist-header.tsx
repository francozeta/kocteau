import { Users, Disc3, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DeezerArtist } from "@/lib/deezer"

interface ArtistHeaderProps {
  artist: DeezerArtist
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toString()
}

export function ArtistHeader({ artist }: ArtistHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-5">
      {/* Artist Picture */}
      <div className="flex-shrink-0 mx-auto md:mx-0">
        <img
          src={artist.picture_big || artist.picture_xl || artist.picture_medium || "/placeholder.svg"}
          alt={artist.name}
          className="w-48 h-48 md:w-44 md:h-44 lg:w-52 lg:h-52 rounded-full object-cover shadow-lg"
        />
      </div>

      {/* Artist Info */}
      <div className="flex-1 flex flex-col justify-center gap-3 min-w-0 text-center md:text-left">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Artist</div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-balance leading-tight">{artist.name}</h1>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {formatNumber(artist.nb_fan)} {artist.nb_fan === 1 ? "fan" : "fans"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Disc3 className="h-4 w-4" />
            {artist.nb_album} {artist.nb_album === 1 ? "release" : "releases"}
          </span>
        </div>

        <div className="flex justify-center md:justify-start gap-2 mt-1">
          <Button asChild variant="outline" size="sm" className="gap-2 bg-transparent">
            <a href={`https://www.deezer.com/artist/${artist.id}`} target="_blank" rel="noopener noreferrer">
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
