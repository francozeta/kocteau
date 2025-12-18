import Link from "next/link"
import { Users } from "lucide-react"
import type { DeezerRelatedArtist } from "@/lib/deezer"

interface RelatedArtistsProps {
  artists: DeezerRelatedArtist[]
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

export function RelatedArtists({ artists }: RelatedArtistsProps) {
  if (artists.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold">Similar Artists</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {artists.map((artist) => (
          <Link key={artist.id} href={`/artist/${artist.id}`} className="group space-y-2 text-center">
            <div className="aspect-square rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors mx-auto">
              <img
                src={artist.picture_medium || artist.picture_big || "/placeholder.svg"}
                alt={artist.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {artist.name}
              </p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                {formatNumber(artist.nb_fan)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
