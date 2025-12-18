import { notFound } from "next/navigation"
import { getTrack } from "@/lib/deezer"
import { TrackHeader } from "@/components/track/track-header"
import { DeezerWidget } from "@/components/track/deezer-widget"
import { TrackReviews } from "@/components/track/track-reviews"
import { QuickActions } from "@/components/track/quick-actions"

interface TrackPageProps {
  params: Promise<{ id: string }>
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { id } = await params
  const trackId = Number.parseInt(id)

  if (isNaN(trackId)) {
    notFound()
  }

  const track = await getTrack(trackId)

  if (!track) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Track Header with cover, title, artist */}
      <TrackHeader track={track} />

      <QuickActions trackId={track.id} trackTitle={track.title} artistName={track.artist.name} />

      {/* Deezer Embedded Player */}
      <DeezerWidget trackId={track.id} />

      {/* Reviews Section */}
      <TrackReviews trackId={track.id} />
    </div>
  )
}
