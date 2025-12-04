import { ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"

const featuredArtists = [
  { id: 1, name: "Aurora Lines", followers: "12.4k", songs: 8 },
  { id: 2, name: "City Static", followers: "8.9k", songs: 12 },
  { id: 3, name: "Mono Bloom", followers: "15.2k", songs: 15 },
  { id: 4, name: "Synthetic Dreams", followers: "6.3k", songs: 5 },
  { id: 5, name: "Echo Chamber", followers: "9.8k", songs: 10 },
  { id: 6, name: "Neon Pulse", followers: "11.5k", songs: 7 },
]

function getAvatarGradient(seed: string) {
  const gradients = [
    "bg-gradient-to-br from-rose-400 to-orange-300",
    "bg-gradient-to-br from-violet-400 to-purple-300",
    "bg-gradient-to-br from-blue-400 to-cyan-300",
    "bg-gradient-to-br from-emerald-400 to-teal-300",
    "bg-gradient-to-br from-amber-400 to-yellow-300",
    "bg-gradient-to-br from-pink-400 to-rose-300",
  ]
  const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[index % gradients.length]
}

export default function ArtistsPage() {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-4xl">
          {/* Page Header */}
          <div>
            <h1 className="text-xl font-semibold">Artists</h1>
            <p className="text-sm text-muted-foreground mt-1">Discover independent and emerging musicians</p>
          </div>

          {/* Featured Artists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Featured</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                See all <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {featuredArtists.map((artist) => (
                <button
                  key={artist.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-border/50 hover:border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div className={`h-12 w-12 rounded-full ${getAvatarGradient(artist.name)} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{artist.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Users className="h-3 w-3" />
                      <span>{artist.followers}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Rising Artists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Rising</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                See all <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {featuredArtists.slice(0, 4).map((artist, i) => (
                <button
                  key={artist.id}
                  className="w-full flex items-center gap-4 p-3 rounded-md border border-border/50 hover:border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-sm text-muted-foreground w-4">{i + 1}</span>
                  <div className={`h-10 w-10 rounded-full ${getAvatarGradient(artist.name + "rising")} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">{artist.songs} releases</p>
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
