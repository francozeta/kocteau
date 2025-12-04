import { ArrowLeft, Users, Star, Music, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import Link from "next/link"

// Mock data
const getArtistData = (id: string) => ({
  id,
  name: "Aurora Lines",
  bio: "Electronic music producer crafting ambient soundscapes and dreamy synth-pop. Based in Los Angeles. Creating music that bridges the gap between digital and organic.",
  avatarGradient: "from-indigo-400 to-purple-500",
  verified: true,
  stats: {
    followers: 12400,
    avgRating: 8.2,
    totalReviews: 5600,
    releases: 4,
  },
  socials: {
    website: "https://auroralines.com",
  },
})

const getArtistReleases = () => [
  {
    id: "1",
    title: "Neon Echoes",
    type: "Album",
    year: "2024",
    avgRating: 8.4,
    reviews: 2340,
    coverGradient: "from-zinc-700 to-zinc-900",
  },
  {
    id: "2",
    title: "Digital Dreams EP",
    type: "EP",
    year: "2023",
    avgRating: 7.8,
    reviews: 1890,
    coverGradient: "from-slate-600 to-slate-800",
  },
  {
    id: "3",
    title: "First Light",
    type: "Single",
    year: "2023",
    avgRating: 8.1,
    reviews: 890,
    coverGradient: "from-neutral-600 to-neutral-800",
  },
]

const getArtistReviews = () => [
  {
    id: "1",
    track: { id: "1", title: "Neon Echoes" },
    author: { username: "alexkim", displayName: "Alex Kim", gradient: "from-rose-400 to-orange-300" },
    rating: 9.2,
    text: "A stunning debut that captures the essence of modern ambient-pop.",
    timestamp: "2h ago",
  },
  {
    id: "2",
    track: { id: "2", title: "Digital Dreams EP" },
    author: { username: "jordanlee", displayName: "Jordan Lee", gradient: "from-violet-400 to-purple-300" },
    rating: 8.0,
    text: "Solid EP with some really memorable moments.",
    timestamp: "1d ago",
  },
]

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const artist = getArtistData(id)
  const releases = getArtistReleases()
  const reviews = getArtistReviews()

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl space-y-6">
          {/* Back */}
          <Link
            href="/artists"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Artists
          </Link>

          {/* Artist Header */}
          <div className="flex items-start gap-6">
            <div className={`h-32 w-32 rounded-full bg-gradient-to-br ${artist.avatarGradient} shrink-0`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{artist.name}</h1>
                {artist.verified && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-foreground text-background font-medium">
                    Artist
                  </span>
                )}
              </div>
              <p className="mt-2 text-muted-foreground leading-relaxed">{artist.bio}</p>
              <div className="mt-4 flex items-center gap-4">
                <Button size="sm">Follow</Button>
                {artist.socials.website && (
                  <Button variant="outline" size="sm" className="gap-1.5 bg-transparent" asChild>
                    <a href={artist.socials.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{(artist.stats.followers / 1000).toFixed(1)}k</span>
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{artist.stats.avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground">Avg rating</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Music className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{artist.stats.releases}</span>
              <span className="text-muted-foreground">Releases</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="releases" className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none">
              <TabsTrigger
                value="releases"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
              >
                Releases
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
              >
                Recent Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="releases" className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {releases.map((release) => (
                  <Link key={release.id} href={`/track/${release.id}`} className="group">
                    <div
                      className={`aspect-square rounded-md bg-gradient-to-br ${release.coverGradient} mb-2 transition-transform group-hover:scale-[1.02]`}
                    />
                    <p className="text-sm font-medium truncate">{release.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {release.type} · {release.year}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{release.avgRating.toFixed(1)}</span>
                      <span>·</span>
                      <span>{release.reviews.toLocaleString()} reviews</span>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4 space-y-0">
              {reviews.map((review) => (
                <Link key={review.id} href={`/review/${review.id}`} className="block">
                  <article className="py-4 border-b border-border/50 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors">
                    <div className="flex gap-3">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${review.author.gradient} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{review.author.displayName}</span>
                            <span className="text-muted-foreground">reviewed</span>
                            <span className="font-medium">{review.track.title}</span>
                          </div>
                          <div className="flex items-center justify-center h-7 w-7 rounded border border-border text-xs font-bold tabular-nums">
                            {review.rating.toFixed(1)}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-foreground/80 line-clamp-2">{review.text}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{review.timestamp}</p>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
