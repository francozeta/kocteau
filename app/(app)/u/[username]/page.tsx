import { Heart, MessageCircle, Calendar, Star, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import Link from "next/link"

// Mock data - will be replaced with real data from Supabase
const getUserData = (username: string) => ({
  id: "1",
  username,
  displayName: username === "alexkim" ? "Alex Kim" : username.charAt(0).toUpperCase() + username.slice(1),
  bio: "Music enthusiast exploring the boundaries of sound. Always looking for the next hidden gem.",
  role: "listener" as const,
  avatarGradient: "from-rose-400 to-orange-300",
  stats: {
    reviews: 47,
    followers: 234,
    following: 89,
    avgRating: 7.2,
  },
  joinedAt: "March 2024",
})

const getUserReviews = () => [
  {
    id: "1",
    albumTitle: "Neon Echoes",
    artist: "Aurora Lines",
    rating: 9.2,
    text: "A stunning debut that captures the essence of modern ambient-pop.",
    likes: 342,
    comments: 28,
    timestamp: "2h ago",
  },
  {
    id: "2",
    albumTitle: "Midnight Signals",
    artist: "City Static",
    rating: 8.5,
    text: "The production is crisp and the vocals are hauntingly beautiful.",
    likes: 156,
    comments: 12,
    timestamp: "1d ago",
  },
  {
    id: "3",
    albumTitle: "Glass Horizon",
    artist: "Synthetic Dreams",
    rating: 6.5,
    text: "Solid effort but lacks the innovation I was hoping for.",
    likes: 45,
    comments: 3,
    timestamp: "3d ago",
  },
]

function getCoverGradient(seed: string) {
  const gradients = [
    "bg-gradient-to-br from-zinc-700 to-zinc-900",
    "bg-gradient-to-br from-slate-600 to-slate-800",
    "bg-gradient-to-br from-neutral-600 to-neutral-800",
  ]
  const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[index % gradients.length]
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = getUserData(username)
  const reviews = getUserReviews()

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl space-y-6">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${user.avatarGradient} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-semibold">{user.displayName}</h1>
                <span className="text-sm text-muted-foreground">@{user.username}</span>
                {user.role === "artist" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-foreground text-background font-medium">
                    Artist
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {user.joinedAt}
                </span>
              </div>
            </div>
            <Button size="sm">Follow</Button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold">{user.stats.reviews}</span>
              <span className="text-muted-foreground ml-1">Reviews</span>
            </div>
            <div>
              <span className="font-semibold">{user.stats.followers}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
            <div>
              <span className="font-semibold">{user.stats.following}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              <span className="font-semibold">{user.stats.avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground">avg</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none">
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger
                value="likes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
              >
                Likes
              </TabsTrigger>
              <TabsTrigger
                value="lists"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2"
              >
                Lists
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="mt-4 space-y-0">
              {reviews.map((review) => (
                <Link key={review.id} href={`/review/${review.id}`} className="block">
                  <article className="py-4 border-b border-border/50 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors">
                    <div className="flex gap-3">
                      <div className={`h-12 w-12 rounded ${getCoverGradient(review.albumTitle)} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{review.albumTitle}</p>
                            <p className="text-xs text-muted-foreground">{review.artist}</p>
                          </div>
                          <div className="flex items-center justify-center h-8 w-8 rounded-md border border-border text-sm font-bold tabular-nums shrink-0">
                            {review.rating.toFixed(1)}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{review.text}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" /> {review.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" /> {review.comments}
                          </span>
                          <span>{review.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="likes" className="mt-4">
              <p className="text-sm text-muted-foreground py-8 text-center">Liked reviews will appear here</p>
            </TabsContent>

            <TabsContent value="lists" className="mt-4">
              <p className="text-sm text-muted-foreground py-8 text-center">User lists will appear here</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
