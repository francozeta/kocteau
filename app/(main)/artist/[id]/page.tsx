import { notFound } from "next/navigation"
import { getArtist, getArtistTopTracks } from "@/lib/deezer"
import { ArtistHeader } from "@/components/artist/artist-header"
import { ArtistTopTracks } from "@/components/artist/artist-top-tracks"

interface ArtistPageProps {
  params: Promise<{ id: string }>
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params
  const artistId = Number.parseInt(id)

  if (isNaN(artistId)) {
    notFound()
  }

  const [artist, topTracks] = await Promise.all([getArtist(artistId), getArtistTopTracks(artistId, 10)])

  if (!artist) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Artist Header with picture, name, stats */}
      <ArtistHeader artist={artist} />

      {/* Top Tracks */}
      <ArtistTopTracks tracks={topTracks} artistName={artist.name} />
    </div>
  )
}
