"use client"

import { Heart, MessageCircle, Play, ArrowLeft, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import Link from "next/link"

// Mock data
const getTrackData = (id: string) => ({
  id,
  title: "Neon Echoes",
  artist: { id: "1", name: "Aurora Lines" },
  genre: "Ambient Pop",
  releaseDate: "2024",
  avgRating: 8.4,
  totalReviews: 2340,
  coverGradient: "from-zinc-700 to-zinc-900",
})

const getTrackReviews = () => [
  {
    id: "1",
    author: { username: "alexkim", displayName: "Alex Kim", gradient: "from-rose-400 to-orange-300" },
    rating: 9.2,
    text: "A stunning debut that captures the essence of modern ambient-pop. Every track flows seamlessly into the next, creating an immersive listening experience.",
    likes: 342,
    comments: 28,
    timestamp: "2h ago",
  },
  {
    id: "2",
    author: { username: "jordanlee", displayName: "Jordan Lee", gradient: "from-violet-400 to-purple-300" },
    rating: 8.5,
    text: "The production is crisp and the vocals are hauntingly beautiful. This album deserves way more recognition.",
    likes: 156,
    comments: 12,
    timestamp: "4h ago",
  },
  {
    id: "3",
    author: { username: "samrivera", displayName: "Sam Rivera", gradient: "from-emerald-400 to-teal-300" },
    rating: 7.0,
    text: "Interesting experimental approach. Some tracks really shine, while others feel a bit underdeveloped.",
    likes: 89,
    comments: 7,
    timestamp: "6h ago",
  },
]

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const track = getTrackData(id)
  const reviews = getTrackReviews()

  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl space-y-6">
          {/* Back */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          {/* Track Header */}
          <div className="flex gap-6">
            <div
              className={`h-48 w-48 rounded-lg bg-gradient-to-br ${track.coverGradient} shrink-0 flex items-center justify-center`}
            >
              <Play className="h-12 w-12 text-white/50" />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{track.genre}</p>
              <h1 className="text-3xl font-bold mt-1">{track.title}</h1>
              <Link
                href={`/artist/${track.artist.id}`}
                className="text-lg text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                {track.artist.name}
              </Link>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-foreground text-background text-lg font-bold tabular-nums">
                    {track.avgRating.toFixed(1)}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Average Rating</p>
                    <p className="text-muted-foreground">{track.totalReviews.toLocaleString()} reviews</p>
                  </div>
                </div>
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reviews</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Most recent
              </Button>
            </div>

            <div className="space-y-0">
              {reviews.map((review) => (
                <Link key={review.id} href={`/review/${review.id}`} className="block">
                  <article className="py-4 border-b border-border/50 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors">
                    <div className="flex gap-3">
                      <Link href={`/u/${review.author.username}`} onClick={(e) => e.stopPropagation()}>
                        <div
                          className={`h-10 w-10 rounded-full bg-gradient-to-br ${review.author.gradient} shrink-0`}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Link
                              href={`/u/${review.author.username}`}
                              className="font-medium hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {review.author.displayName}
                            </Link>
                            <span className="text-muted-foreground">@{review.author.username}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{review.timestamp}</span>
                          </div>
                          <div className="flex items-center justify-center h-8 w-8 rounded-md border border-border text-sm font-bold tabular-nums">
                            {review.rating.toFixed(1)}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-foreground/90 leading-relaxed">{review.text}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <Heart className="h-4 w-4" />
                            <span>{review.likes}</span>
                          </button>
                          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            <span>{review.comments}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            <div className="flex justify-center pt-6">
              <Button variant="outline" size="sm">
                Load more reviews
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
