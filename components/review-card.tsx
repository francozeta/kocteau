"use client"

import { useState } from "react"
import { Heart, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ReviewCardProps {
  review: {
    id: string
    author: {
      username: string
      displayName: string
      avatarGradient?: string
    }
    song?: {
      id: string
      title: string
      artist: string
      coverGradient?: string
    }
    rating: number
    title?: string
    body: string
    likes: number
    comments: number
    liked?: boolean
    timestamp: string
  }
  variant?: "default" | "compact" | "detailed"
  showSongInfo?: boolean
  className?: string
}

function getAvatarGradient(seed: string) {
  const gradients = [
    "bg-gradient-to-br from-zinc-400 to-zinc-600",
    "bg-gradient-to-br from-zinc-500 to-zinc-700",
    "bg-gradient-to-br from-zinc-300 to-zinc-500",
    "bg-gradient-to-br from-zinc-600 to-zinc-800",
  ]
  const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[index % gradients.length]
}

function getRatingWeight(rating: number) {
  if (rating >= 9) return "font-black"
  if (rating >= 8) return "font-extrabold"
  if (rating >= 7) return "font-bold"
  if (rating >= 6) return "font-semibold"
  return "font-medium"
}

export function ReviewCard({ 
  review, 
  variant = "default",
  showSongInfo = true,
  className 
}: ReviewCardProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(review.liked ?? false)
  const [likeCount, setLikeCount] = useState(review.likes)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    // TODO: Call server action to like/unlike
  }

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    // Only navigate if clicking on the article itself, not on nested interactive elements
    const target = e.target as HTMLElement
    if (target.closest('a, button, [role="button"]')) {
      return
    }
    router.push(`/review/${review.id}`)
  }

  const avatarGradient = review.author.avatarGradient || getAvatarGradient(review.author.username)
  const isCompact = variant === "compact"
  const isDetailed = variant === "detailed"

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        "group transition-all duration-200 cursor-pointer",
        variant === "default" && "py-4 md:py-5 border-b border-border/50 last:border-0 hover:bg-muted/30 -mx-2 md:-mx-3 px-2 md:px-3 rounded-lg",
        variant === "compact" && "py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded",
        variant === "detailed" && "py-5 md:py-6 border-b border-border/50 last:border-0 hover:bg-muted/40 -mx-3 md:-mx-4 px-3 md:px-4 rounded-lg",
        className
      )}
    >
        <div className={cn("flex gap-3 md:gap-4", isCompact && "gap-2")}>
          {/* Avatar */}
          <Link 
            href={`/u/${review.author.username}`} 
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <div
              className={cn(
                "rounded-full border-2 border-background transition-all group-hover:border-foreground/20 group-hover:scale-105",
                isCompact ? "h-8 w-8" : "h-10 w-10 md:h-11 md:w-11",
                avatarGradient
              )}
            />
          </Link>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className={cn(
              "flex items-center gap-1.5 md:gap-2 text-sm mb-2",
              isCompact && "text-xs mb-1.5"
            )}>
              <Link
                href={`/u/${review.author.username}`}
                className="font-semibold hover:text-foreground transition-colors truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {review.author.displayName}
              </Link>
              <span className="text-muted-foreground shrink-0">@{review.author.username}</span>
              <span className="text-muted-foreground shrink-0">·</span>
              <span className={cn(
                "text-muted-foreground shrink-0",
                isCompact ? "text-xs" : "text-xs md:text-sm"
              )}>
                {review.timestamp}
              </span>
            </div>

            {/* Song info with rating */}
            {showSongInfo && review.song && (
              <div className={cn(
                "flex items-center gap-2 md:gap-3 mb-3",
                isCompact && "mb-2"
              )}>
                <Link 
                  href={`/track/${review.song.id}`} 
                  onClick={(e) => e.stopPropagation()} 
                  className="group/song shrink-0"
                >
                  <div
                    className={cn(
                      "rounded-lg border border-border/50 shadow-sm transition-all group-hover/song:scale-105 group-hover/song:shadow-md",
                      isCompact ? "h-10 w-10" : "h-12 w-12 md:h-14 md:w-14",
                      review.song.coverGradient || "bg-muted"
                    )}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "font-semibold truncate",
                    isCompact ? "text-xs" : "text-sm"
                  )}>
                    {review.song.title}
                  </p>
                  <p className={cn(
                    "text-muted-foreground truncate mt-0.5",
                    isCompact ? "text-xs" : "text-xs"
                  )}>
                    {review.song.artist}
                  </p>
                </div>
                <div
                  className={cn(
                    "shrink-0 flex items-center justify-center rounded-lg border-2 border-foreground/20 bg-background text-foreground shadow-sm",
                    isCompact ? "h-8 w-8 text-xs" : "h-9 w-9 md:h-10 md:w-10 text-sm",
                    getRatingWeight(review.rating),
                    "tabular-nums"
                  )}
                >
                  {review.rating.toFixed(1)}
                </div>
              </div>
            )}

            {/* Review title (optional) */}
            {review.title && !isCompact && (
              <h3 className="text-sm md:text-base font-semibold mb-1.5 line-clamp-1">
                {review.title}
              </h3>
            )}

            {/* Review text */}
            <Link 
              href={`/review/${review.id}`}
              className="block"
              onClick={(e) => e.stopPropagation()}
            >
              <p
                className={cn(
                  "text-foreground/90 leading-relaxed hover:text-foreground transition-colors",
                  isCompact ? "text-xs line-clamp-2" : isDetailed ? "text-sm md:text-base line-clamp-none" : "text-sm line-clamp-3"
                )}
              >
                {review.body}
              </p>
            </Link>

            {/* Actions */}
            <div className={cn(
              "mt-3 md:mt-4 flex items-center gap-4 md:gap-6",
              isCompact && "mt-2 gap-3"
            )}>
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1.5 transition-all duration-200",
                  liked
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  isCompact ? "text-xs" : "text-sm"
                )}
              >
                <Heart
                  className={cn(
                    "transition-transform",
                    isCompact ? "h-3.5 w-3.5" : "h-4 w-4",
                    liked && "scale-110"
                  )}
                  fill={liked ? "currentColor" : "none"}
                />
                <span className="font-medium">{likeCount}</span>
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
                  isCompact ? "text-xs" : "text-sm"
                )}
              >
                <MessageCircle className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                <span className="font-medium">{review.comments}</span>
              </button>
            </div>
          </div>
        </div>
      </article>
  )
}

