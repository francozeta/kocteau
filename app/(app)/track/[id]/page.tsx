import { Play, ArrowLeft, Share2, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ReviewCard } from "@/components/review-card"
import { Suspense } from "react"

// Mock data - TODO: Replace with Supabase query
async function getTrackData(id: string) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 0))
  return {
    id,
    title: "Neon Echoes",
    artist: { id: "1", name: "Aurora Lines" },
    genre: "Ambient Pop",
    releaseDate: "2024",
    avgRating: 8.4,
    totalReviews: 2340,
    coverGradient: "bg-muted",
  }
}

async function getTrackReviews(songId: string) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 0))
  return [
    {
      id: "1",
      author: { username: "alexkim", displayName: "Alex Kim" },
      song: {
        id: songId,
        title: "Neon Echoes",
        artist: "Aurora Lines",
        coverGradient: "bg-muted",
      },
      rating: 9.2,
      body: "A stunning debut that captures the essence of modern ambient-pop. Every track flows seamlessly into the next, creating an immersive listening experience.",
      likes: 342,
      comments: 28,
      timestamp: "2h ago",
    },
    {
      id: "2",
      author: { username: "jordanlee", displayName: "Jordan Lee" },
      song: {
        id: songId,
        title: "Neon Echoes",
        artist: "Aurora Lines",
        coverGradient: "bg-muted",
      },
      rating: 8.5,
      body: "The production is crisp and the vocals are hauntingly beautiful. This album deserves way more recognition.",
      likes: 156,
      comments: 12,
      timestamp: "4h ago",
    },
    {
      id: "3",
      author: { username: "samrivera", displayName: "Sam Rivera" },
      song: {
        id: songId,
        title: "Neon Echoes",
        artist: "Aurora Lines",
        coverGradient: "bg-muted",
      },
      rating: 7.0,
      body: "Interesting experimental approach. Some tracks really shine, while others feel a bit underdeveloped.",
      likes: 89,
      comments: 7,
      timestamp: "6h ago",
    },
  ]
}

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const track = await getTrackData(id)
  const reviews = await getTrackReviews(id)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </Link>

        {/* Track Header */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 lg:gap-8">
          {/* Cover */}
          <div className="shrink-0">
            <div
              className={`aspect-square rounded-lg ${track.coverGradient} border border-border/50 shadow-lg flex items-center justify-center group cursor-pointer transition-transform hover:scale-[1.02]`}
            >
              <Play className="h-12 w-12 md:h-16 md:w-16 text-foreground/20 group-hover:text-foreground/40 transition-colors" />
            </div>
          </div>

          {/* Track Info */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wide mb-1">
                {track.genre}
              </p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 break-words">
                {track.title}
              </h1>
              <Link
                href={`/artists/${track.artist.id}`}
                className="text-base md:text-lg text-muted-foreground hover:text-foreground transition-colors inline-block"
              >
                {track.artist.name}
              </Link>
            </div>

            {/* Stats and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6 md:mt-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-lg border-2 border-foreground/20 bg-background text-foreground text-lg md:text-xl font-black tabular-nums shadow-sm">
                  {track.avgRating.toFixed(1)}
                </div>
                <div className="text-sm md:text-base">
                  <p className="font-semibold">Average Rating</p>
                  <p className="text-muted-foreground text-xs md:text-sm">
                    {track.totalReviews.toLocaleString()} reviews
                  </p>
                </div>
              </div>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Reviews</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {track.totalReviews.toLocaleString()} total reviews
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground shrink-0">
              <span className="hidden sm:inline">Most recent</span>
              <span className="sm:hidden">Recent</span>
            </Button>
          </div>

          <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading reviews...</div>}>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    variant="default"
                    showSongInfo={false}
                  />
                ))
              ) : (
                <div className="p-12 text-center">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to review this song</p>
                </div>
              )}
            </Suspense>
          </div>

          {reviews.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" size="lg" className="min-w-32">
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
