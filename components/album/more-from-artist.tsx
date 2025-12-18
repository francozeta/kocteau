import Link from "next/link"
import { Calendar, ChevronRight } from "lucide-react"
import type { DeezerArtistAlbum } from "@/lib/deezer"
import { Button } from "@/components/ui/button"

interface MoreFromArtistProps {
  albums: DeezerArtistAlbum[]
  artistName: string
  artistId: number
}

export function MoreFromArtist({ albums, artistName, artistId }: MoreFromArtistProps) {
  if (albums.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">More from {artistName}</h2>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href={`/artist/${artistId}`}>
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {albums.map((album) => (
          <Link key={album.id} href={`/album/${album.id}`} className="group space-y-2">
            <div className="aspect-square rounded-lg overflow-hidden border border-border group-hover:border-primary transition-colors">
              <img
                src={album.cover_medium || album.cover_big || "/placeholder.svg"}
                alt={album.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {album.title}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(album.release_date).getFullYear()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
