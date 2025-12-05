import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Link from "next/link"
import { ReviewCard } from "@/components/review-card"

// Sample data
const trendingAlbums = [
  { id: 1, title: "Neon Echoes", artist: "Aurora Lines", reviews: "2.3k" },
  { id: 2, title: "Midnight Signals", artist: "City Static", reviews: "1.8k" },
  { id: 3, title: "Velvet Circuits", artist: "Mono Bloom", reviews: "1.4k" },
  { id: 4, title: "Glass Horizon", artist: "Synthetic Dreams", reviews: "1.1k" },
  { id: 5, title: "Digital Rain", artist: "Echo Chamber", reviews: "980" },
  { id: 6, title: "Soft Machine", artist: "Luna Park", reviews: "870" },
]

const reviews = [
  {
    id: "1",
    author: { username: "alexkim", displayName: "Alex Kim" },
    song: {
      id: "1",
      title: "Neon Echoes",
      artist: "Aurora Lines",
      coverGradient: "bg-muted",
    },
    rating: 9.2,
    body: "A stunning debut that captures the essence of modern ambient-pop. Every track flows seamlessly into the next, creating an immersive listening experience.",
    likes: 342,
    comments: 28,
    liked: false,
    timestamp: "2h ago",
  },
  {
    id: "2",
    author: { username: "jordanlee", displayName: "Jordan Lee" },
    song: {
      id: "2",
      title: "Midnight Signals",
      artist: "City Static",
      coverGradient: "bg-muted",
    },
    rating: 8.5,
    body: "The production is crisp and the vocals are hauntingly beautiful. This album deserves way more recognition.",
    likes: 156,
    comments: 12,
    liked: false,
    timestamp: "4h ago",
  },
  {
    id: "3",
    author: { username: "samrivera", displayName: "Sam Rivera" },
    song: {
      id: "3",
      title: "Velvet Circuits",
      artist: "Mono Bloom",
      coverGradient: "bg-muted",
    },
    rating: 7.0,
    body: "Interesting experimental approach. Some tracks really shine, while others feel a bit underdeveloped.",
    likes: 89,
    comments: 7,
    liked: false,
    timestamp: "6h ago",
  },
]

// Helper function for cover gradients (simplified for black/white theme)
function getCoverGradient(seed: string) {
  return "bg-muted border border-border/50"
}

function TrendingCard({ album }: { album: (typeof trendingAlbums)[0] }) {
  return (
    <Link href={`/track/${album.id}`} className="group cursor-pointer block">
      <div className="relative overflow-hidden rounded-lg mb-3">
        <div
          className={`aspect-square ${getCoverGradient(album.title)} transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <p className="text-sm font-semibold truncate group-hover:text-foreground transition-colors">{album.title}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{album.artist}</p>
      <p className="text-xs text-muted-foreground mt-1">{album.reviews} reviews</p>
    </Link>
  )
}

export default function HomePage() {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-10 max-w-4xl mx-auto">
          {/* Trending Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
                <p className="text-sm text-muted-foreground mt-1">Most discussed this week</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                See all <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {trendingAlbums.map((album) => (
                  <CarouselItem key={album.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <TrendingCard album={album} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-3 bg-background/80 backdrop-blur-sm border-border/50" />
              <CarouselNext className="hidden sm:flex -right-3 bg-background/80 backdrop-blur-sm border-border/50" />
            </Carousel>
          </section>

          {/* Reviews Feed Section */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Latest Reviews</h2>
              <p className="text-sm text-muted-foreground mt-1">See what the community is listening to</p>
            </div>
            <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} variant="default" showSongInfo={true} />
              ))}
            </div>
            <div className="flex justify-center pt-8">
              <Button variant="outline" size="lg" className="min-w-32">
                Load more
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
