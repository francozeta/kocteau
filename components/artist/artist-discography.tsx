"use client"

import Link from "next/link"
import { useState } from "react"
import { Calendar } from "lucide-react"
import type { DeezerArtistAlbum } from "@/lib/deezer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface ArtistDiscographyProps {
  albums: DeezerArtistAlbum[]
  artistName: string
}

export function ArtistDiscography({ albums, artistName }: ArtistDiscographyProps) {
  const [sortBy, setSortBy] = useState<"date" | "title">("date")

  // Filter by type
  const allAlbums = albums.filter((a) => a.record_type === "album")
  const singles = albums.filter((a) => a.record_type === "single")
  const eps = albums.filter((a) => a.record_type === "ep")
  const compilations = albums.filter((a) => a.record_type === "compilation")

  const sortAlbums = (items: DeezerArtistAlbum[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      }
      return a.title.localeCompare(b.title)
    })
  }

  if (albums.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">Discography</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "title")}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
        >
          <option value="date">Release Date</option>
          <option value="title">Title</option>
        </select>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({albums.length})</TabsTrigger>
          <TabsTrigger value="album">Albums ({allAlbums.length})</TabsTrigger>
          <TabsTrigger value="single">Singles ({singles.length})</TabsTrigger>
          <TabsTrigger value="ep">EPs ({eps.length})</TabsTrigger>
          <TabsTrigger value="compilation">Compilations ({compilations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AlbumGrid albums={sortAlbums(albums)} />
        </TabsContent>
        <TabsContent value="album">
          <AlbumGrid albums={sortAlbums(allAlbums)} />
        </TabsContent>
        <TabsContent value="single">
          <AlbumGrid albums={sortAlbums(singles)} />
        </TabsContent>
        <TabsContent value="ep">
          <AlbumGrid albums={sortAlbums(eps)} />
        </TabsContent>
        <TabsContent value="compilation">
          <AlbumGrid albums={sortAlbums(compilations)} />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function AlbumGrid({ albums }: { albums: DeezerArtistAlbum[] }) {
  if (albums.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No items found</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
      {albums.map((album) => (
        <Link key={album.id} href={`/album/${album.id}`} className="group space-y-2">
          <div className="aspect-square rounded-lg overflow-hidden border border-border group-hover:border-primary transition-colors">
            <img
              src={album.cover_medium || album.cover_big || "/placeholder.svg"}
              alt={album.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{album.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(album.release_date).getFullYear()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
