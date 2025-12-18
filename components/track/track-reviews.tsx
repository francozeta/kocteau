import { MessageSquare } from "lucide-react"
import { CreateReviewButton } from "@/components/track/create-review-button"

interface TrackReviewsProps {
  trackId: number
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4 text-center">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="h-7 w-7 md:h-8 md:w-8 text-primary" />
      </div>
      <h3 className="text-base md:text-lg font-semibold mb-2">No reviews yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm text-balance">
        Be the first to share your thoughts on this track. What did you think?
      </p>
      <CreateReviewButton />
    </div>
  )
}

export async function TrackReviews({ trackId }: TrackReviewsProps) {
  // TODO: Fetch reviews from database using trackId
  const reviews: any[] = []

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-semibold">Reviews</h2>
          {reviews.length > 0 && <span className="text-sm text-muted-foreground tabular-nums">({reviews.length})</span>}
        </div>
        {reviews.length > 0 && <CreateReviewButton />}
      </div>

      {/* Reviews List or Empty State */}
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id}>{/* TODO: Render ReviewCard component */}</div>
          ))}
        </div>
      )}
    </section>
  )
}
