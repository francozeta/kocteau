import { notFound } from "next/navigation"
import { getAlbum } from "@/lib/deezer"
import { AlbumHeader } from "@/components/album/album-header"
import { DeezerWidget } from "@/components/track/deezer-widget"
import { AlbumTracklist } from "@/components/album/album-tracklist"

interface AlbumPageProps {
  params: Promise<{ id: string }>
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params
  const albumId = Number.parseInt(id)

  if (isNaN(albumId)) {
    notFound()
  }

  const album = await getAlbum(albumId)

  if (!album) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Album Header with cover, title, artist */}
      <AlbumHeader album={album} />
      {/* Album Tracklist */}
      <AlbumTracklist tracks={album.tracks.data} album={album} />
    </div>
  )
}
