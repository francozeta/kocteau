"use client"

import type React from "react"

import { Heart, MessageCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Header } from "@/components/header"
import Link from "next/link"

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
    id: 1,
    author: "Alex Kim",
    username: "alexkim",
    albumTitle: "Neon Echoes",
    artist: "Aurora Lines",
    rating: 9.2,
    text: "A stunning debut that captures the essence of modern ambient-pop. Every track flows seamlessly into the next, creating an immersive listening experience.",
    likes: 342,
    comments: 28,
    liked: false,
    timestamp: "2h",
  },
  {
    id: 2,
    author: "Jordan Lee",
    username: "jordanlee",
    albumTitle: "Midnight Signals",
    artist: "City Static",
    rating: 8.5,
    text: "The production is crisp and the vocals are hauntingly beautiful. This album deserves way more recognition.",
    likes: 156,
    comments: 12,
    liked: false,
    timestamp: "4h",
  },
  {
    id: 3,
    author: "Sam Rivera",
    username: "samrivera",
    albumTitle: "Velvet Circuits",
    artist: "Mono Bloom",
    rating: 7.0,
    text: "Interesting experimental approach. Some tracks really shine, while others feel a bit underdeveloped.",
    likes: 89,
    comments: 7,
    liked: false,
    timestamp: "6h",
  },
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

function getCoverGradient(seed: string) {
  const gradients = [
    "bg-gradient-to-br from-zinc-700 to-zinc-900",
    "bg-gradient-to-br from-slate-600 to-slate-800",
    "bg-gradient-to-br from-neutral-600 to-neutral-800",
    "bg-gradient-to-br from-stone-600 to-stone-800",
    "bg-gradient-to-br from-gray-600 to-gray-800",
  ]
  const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[index % gradients.length]
}

function TrendingCard({ album }: { album: (typeof trendingAlbums)[0] }) {
  return (
    <Link href={`/track/${album.id}`} className="group cursor-pointer block">
      <div
        className={`aspect-square rounded-md ${getCoverGradient(album.title)} mb-2 transition-transform group-hover:scale-[1.02]`}
      />
      <p className="text-sm font-medium truncate">{album.title}</p>
      <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
      <p className="text-xs text-muted-foreground">{album.reviews} reviews</p>
    </Link>
  )
}

function ReviewCard({ review }: { review: (typeof reviews)[0] }) {
  const [liked, setLiked] = useState(review.liked)
  const [likeCount, setLikeCount] = useState(review.likes)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  return (
    <Link href={`/review/${review.id}`} className="block">
      <article className="py-4 border-b border-border/50 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors">
        <div className="flex gap-3">
          <Link href={`/u/${review.username}`} onClick={(e) => e.stopPropagation()}>
            <div className={`h-10 w-10 rounded-full shrink-0 ${getAvatarGradient(review.author)}`} />
          </Link>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm">
              <Link
                href={`/u/${review.username}`}
                className="font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {review.author}
              </Link>
              <span className="text-muted-foreground">@{review.username}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{review.timestamp}</span>
            </div>

            {/* Album info with rating */}
            <div className="flex items-center gap-3 mt-2">
              <Link href={`/track/${review.id}`} onClick={(e) => e.stopPropagation()}>
                <div className={`h-12 w-12 rounded ${getCoverGradient(review.albumTitle)} shrink-0`} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{review.albumTitle}</p>
                <p className="text-xs text-muted-foreground truncate">{review.artist}</p>
              </div>
              <div className="shrink-0 flex items-center justify-center h-9 w-9 rounded-md border border-border text-sm font-bold tabular-nums">
                {review.rating.toFixed(1)}
              </div>
            </div>

            {/* Review text */}
            <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{review.text}</p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
                <span>{likeCount}</span>
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{review.comments}</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default function HomePage() {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-4xl">
          {/* Trending Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Trending Now</h2>
                <p className="text-sm text-muted-foreground">Most discussed this week</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                See all <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-3">
                {trendingAlbums.map((album) => (
                  <CarouselItem key={album.id} className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <TrendingCard album={album} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-3" />
              <CarouselNext className="hidden sm:flex -right-3" />
            </Carousel>
          </section>

          {/* Reviews Feed Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Latest Reviews</h2>
            <div>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <div className="flex justify-center pt-6">
              <Button variant="outline" size="sm">
                Load more
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
