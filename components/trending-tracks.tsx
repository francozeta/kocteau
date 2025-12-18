import Link from "next/link"
import { getChartTracks } from "@/lib/deezer"
import { Play } from "lucide-react"

export async function TrendingTracks() {
  const tracks = await getChartTracks(6)

  if (!tracks.length) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Trending Now</h2>
        <Link href="/charts" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          See all
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tracks.map((track) => (
          <Link
            key={track.id}
            href={`/track/${track.id}`}
            className="group relative rounded-lg overflow-hidden bg-muted"
          >
            <img
              src={track.album.cover_medium || "/placeholder.svg"}
              alt={track.album.title}
              className="w-full aspect-square object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <p className="text-xs font-medium text-white truncate">{track.title}</p>
              <p className="text-xs text-white/70 truncate">{track.artist.name}</p>
            </div>
            {track.preview && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-4 w-4 text-black ml-0.5" />
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
