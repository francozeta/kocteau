import { Heart, MessageCircle, ArrowLeft, Share2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/header"
import Link from "next/link"

// Mock data
const getReviewData = (id: string) => ({
  id,
  author: {
    username: "alexkim",
    displayName: "Alex Kim",
    gradient: "from-rose-400 to-orange-300",
  },
  track: {
    id: "1",
    title: "Neon Echoes",
    artist: { id: "1", name: "Aurora Lines" },
    coverGradient: "from-zinc-700 to-zinc-900",
  },
  rating: 9.2,
  text: "A stunning debut that captures the essence of modern ambient-pop. Every track flows seamlessly into the next, creating an immersive listening experience. The production quality is exceptional, with layers of synths that wrap around you like a warm blanket. Aurora Lines has crafted something truly special here - a record that rewards repeated listens and reveals new details with each play.",
  likes: 342,
  comments: 28,
  liked: false,
  timestamp: "2 hours ago",
  createdAt: "December 3, 2025",
})

const getReviewComments = () => [
  {
    id: "1",
    author: { username: "jordanlee", displayName: "Jordan Lee", gradient: "from-violet-400 to-purple-300" },
    text: "Completely agree! This album has been on repeat for me all week.",
    timestamp: "1h ago",
    likes: 12,
  },
  {
    id: "2",
    author: { username: "samrivera", displayName: "Sam Rivera", gradient: "from-emerald-400 to-teal-300" },
    text: "Great review. Track 4 is definitely the standout for me.",
    timestamp: "45m ago",
    likes: 8,
  },
]

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const review = getReviewData(id)
  const comments = getReviewComments()

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-2xl space-y-6">
          {/* Back */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          {/* Review */}
          <article className="space-y-4">
            {/* Author */}
            <div className="flex items-center justify-between">
              <Link href={`/u/${review.author.username}`} className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${review.author.gradient}`} />
                <div>
                  <p className="font-medium">{review.author.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{review.author.username}</p>
                </div>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Track info */}
            <Link
              href={`/track/${review.track.id}`}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className={`h-16 w-16 rounded-md bg-gradient-to-br ${review.track.coverGradient} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{review.track.title}</p>
                <p className="text-sm text-muted-foreground">{review.track.artist.name}</p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-foreground text-background text-xl font-bold tabular-nums">
                {review.rating.toFixed(1)}
              </div>
            </Link>

            {/* Review text */}
            <p className="text-foreground leading-relaxed">{review.text}</p>

            {/* Metadata */}
            <p className="text-sm text-muted-foreground">{review.createdAt}</p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Heart className="h-5 w-5" />
                  <span>{review.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="h-5 w-5" />
                  <span>{review.comments}</span>
                </button>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </article>

          {/* Comments */}
          <div className="space-y-4">
            <h3 className="font-semibold">Comments</h3>

            {/* Comment input */}
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 shrink-0" />
              <div className="flex-1 space-y-2">
                <Textarea placeholder="Add a comment..." className="min-h-20 resize-none" />
                <div className="flex justify-end">
                  <Button size="sm">Comment</Button>
                </div>
              </div>
            </div>

            {/* Comments list */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Link href={`/u/${comment.author.username}`}>
                    <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${comment.author.gradient} shrink-0`} />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Link href={`/u/${comment.author.username}`} className="font-medium hover:underline">
                        {comment.author.displayName}
                      </Link>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{comment.timestamp}</span>
                    </div>
                    <p className="mt-1 text-sm">{comment.text}</p>
                    <button className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
