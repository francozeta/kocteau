import { notFound } from "next/navigation"
import { getArtist, getArtistTopTracks, getArtistAlbums, getRelatedArtists } from "@/lib/deezer"
import { ArtistHeader } from "@/components/artist/artist-header"
import { ArtistTopTracks } from "@/components/artist/artist-top-tracks"
import { ArtistDiscography } from "@/components/artist/artist-discography"
import { RelatedArtists } from "@/components/artist/related-artists"

interface ArtistPageProps {
  params: Promise<{ id: string }>
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params
  const artistId = Number.parseInt(id)

  if (isNaN(artistId)) {
    notFound()
  }

  const [artist, topTracks, albums, relatedArtists] = await Promise.all([
    getArtist(artistId),
    getArtistTopTracks(artistId, 10),
    getArtistAlbums(artistId, 50),
    getRelatedArtists(artistId, 12),
  ])

  if (!artist) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 space-y-8 md:space-y-12">
      {/* Artist Header with picture, name, stats */}
      <ArtistHeader artist={artist} />

      {/* Top Tracks */}
      <ArtistTopTracks tracks={topTracks} artistName={artist.name} />

      <ArtistDiscography albums={albums} artistName={artist.name} />

      {relatedArtists.length > 0 && <RelatedArtists artists={relatedArtists} />}
    </div>
  )
}
