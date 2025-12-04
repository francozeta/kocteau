import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"

const genres = [
  { name: "Ambient", count: 1240 },
  { name: "Electronic", count: 2180 },
  { name: "Indie Pop", count: 1890 },
  { name: "Lo-fi", count: 920 },
  { name: "Experimental", count: 680 },
  { name: "Synthwave", count: 1450 },
  { name: "Jazz", count: 890 },
  { name: "Classical", count: 560 },
]

const newReleases = [
  { id: 1, title: "Neon Echoes", artist: "Aurora Lines", rating: 8.9 },
  { id: 2, title: "Midnight Signals", artist: "City Static", rating: 8.2 },
  { id: 3, title: "Velvet Circuits", artist: "Mono Bloom", rating: 7.8 },
  { id: 4, title: "Glass Horizon", artist: "Synthetic Dreams", rating: 8.5 },
]

function getCoverGradient(seed: string) {
  const gradients = [
    "bg-gradient-to-br from-zinc-700 to-zinc-900",
    "bg-gradient-to-br from-slate-600 to-slate-800",
    "bg-gradient-to-br from-neutral-600 to-neutral-800",
    "bg-gradient-to-br from-stone-600 to-stone-800",
  ]
  const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[index % gradients.length]
}

export default function DiscoverPage() {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-4xl">
          {/* Browse by Genre */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Browse by Genre</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                See all <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.name}
                  className="flex items-center justify-between p-3 rounded-md border border-border/50 hover:border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-sm font-medium">{genre.name}</span>
                  <span className="text-xs text-muted-foreground">{genre.count}</span>
                </button>
              ))}
            </div>
          </section>

          {/* New Releases */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Releases</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                See all <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {newReleases.map((album) => (
                <div key={album.id} className="group cursor-pointer">
                  <div
                    className={`aspect-square rounded-md ${getCoverGradient(album.title)} mb-2 transition-transform group-hover:scale-[1.02]`}
                  />
                  <p className="text-sm font-medium truncate">{album.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                  <p className="text-xs text-muted-foreground mt-1">{album.rating.toFixed(1)} avg</p>
                </div>
              ))}
            </div>
          </section>

          {/* Curated Collections */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Curated Collections</h2>
            </div>
            <div className="space-y-2">
              {[
                { title: "Perfect for Focus", desc: "Ambient and lo-fi tracks for deep work" },
                { title: "Rising Artists", desc: "Emerging talents worth discovering" },
                { title: "Weekend Vibes", desc: "Chill selections for your downtime" },
              ].map((collection) => (
                <button
                  key={collection.title}
                  className="w-full flex items-center justify-between p-4 rounded-md border border-border/50 hover:border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{collection.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{collection.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
