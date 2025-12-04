import { Heart, MessageCircle, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const myReviews = [
  {
    id: 1,
    title: "Neon Echoes",
    artist: "Aurora Lines",
    rating: 9.2,
    text: "A stunning debut that captures the essence of modern ambient-pop. Every track flows seamlessly into the next.",
    likes: 342,
    comments: 28,
    date: "2 days ago",
  },
  {
    id: 2,
    title: "Midnight Signals",
    artist: "City Static",
    rating: 8.5,
    text: "The production is crisp and the vocals are hauntingly beautiful. This album deserves way more recognition.",
    likes: 156,
    comments: 12,
    date: "1 week ago",
  },
  {
    id: 3,
    title: "Glass Horizon",
    artist: "Synthetic Dreams",
    rating: 7.0,
    text: "Solid effort with some standout moments. The second half loses steam but still worth a listen.",
    likes: 89,
    comments: 5,
    date: "2 weeks ago",
  },
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

export default function ReviewsPage() {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-3xl">
          {/* Page Header */}
          <div>
            <h1 className="text-xl font-semibold">Your Reviews</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and view all your music reviews</p>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold">{myReviews.length}</span>
              <span className="text-muted-foreground ml-1">reviews</span>
            </div>
            <div>
              <span className="font-semibold">{myReviews.reduce((acc, r) => acc + r.likes, 0)}</span>
              <span className="text-muted-foreground ml-1">total likes</span>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {myReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-md border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex gap-3">
                  <div className={`h-14 w-14 rounded ${getCoverGradient(review.title)} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{review.title}</p>
                        <p className="text-xs text-muted-foreground">{review.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums border border-border rounded-md px-2 py-0.5">
                          {review.rating.toFixed(1)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90 mt-2 line-clamp-2">{review.text}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        <span>{review.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{review.comments}</span>
                      </div>
                      <span>{review.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
