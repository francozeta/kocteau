import Link from "next/link"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ReviewCardProps {
  review: {
    id: string
    user: {
      name: string
      username: string
      avatar: string
    }
    track: {
      id: number
      title: string
      artist: string
      album: string
      cover: string
    }
    rating: number
    body: string
    likes: number
    comments: number
    createdAt: string
  }
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold tabular-nums",
        rating >= 8
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : rating >= 5
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "bg-red-500/15 text-red-600 dark:text-red-400",
      )}
    >
      {rating}
    </div>
  )
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="rounded-xl border border-border/50 bg-card p-4 transition-colors hover:bg-muted/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/user/${review.user.username}`}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={review.user.avatar || "/placeholder.svg"} alt={review.user.name} />
            <AvatarFallback>{review.user.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/user/${review.user.username}`} className="text-sm font-medium leading-none hover:underline">
            {review.user.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            @{review.user.username} · {review.createdAt}
          </p>
        </div>
        <RatingBadge rating={review.rating} />
      </div>

      {/* Track */}
      <Link href={`/track/${review.track.id}`} className="flex gap-3 mb-3 group">
        <img
          src={review.track.cover || "/placeholder.svg"}
          alt={review.track.album}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
        <div className="min-w-0 flex flex-col justify-center">
          <h3 className="font-medium text-sm leading-tight truncate group-hover:underline">{review.track.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{review.track.artist}</p>
          <p className="text-xs text-muted-foreground/70 truncate">{review.track.album}</p>
        </div>
      </Link>

      {/* Body */}
      <p className="text-sm text-foreground/90 leading-relaxed mb-3">{review.body}</p>

      {/* Actions */}
      <div className="flex items-center gap-1 -ml-2">
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground">
          <Heart className="h-4 w-4" />
          <span className="text-xs tabular-nums">{review.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground">
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs tabular-nums">{review.comments}</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  )
}
