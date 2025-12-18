"use client"

import Link from "next/link"
import { useState } from "react"
import { Calendar } from "lucide-react"
import type { DeezerArtistAlbum } from "@/lib/deezer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

interface ArtistDiscographyProps {
  albums: DeezerArtistAlbum[]
  artistName: string
}

function getYearFromReleaseDate(releaseDate: string): number {
  if (!releaseDate) return 0

  // Try to parse the date - Deezer returns YYYY-MM-DD format
  const date = new Date(releaseDate)

  // Check if date is valid
  if (isNaN(date.getTime())) {
    // If invalid, try to extract year directly from string
    const yearMatch = releaseDate.match(/^\d{4}/)
    if (yearMatch) {
      return Number.parseInt(yearMatch[0])
    }
    return 0
  }

  return date.getFullYear()
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
        const dateA = new Date(a.release_date).getTime()
        const dateB = new Date(b.release_date).getTime()

        // If dates are invalid, put them at the end
        if (isNaN(dateA) && isNaN(dateB)) return 0
        if (isNaN(dateA)) return 1
        if (isNaN(dateB)) return -1

        return dateB - dateA
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
          <AlbumCarousel albums={sortAlbums(albums)} />
        </TabsContent>
        <TabsContent value="album">
          <AlbumCarousel albums={sortAlbums(allAlbums)} />
        </TabsContent>
        <TabsContent value="single">
          <AlbumCarousel albums={sortAlbums(singles)} />
        </TabsContent>
        <TabsContent value="ep">
          <AlbumCarousel albums={sortAlbums(eps)} />
        </TabsContent>
        <TabsContent value="compilation">
          <AlbumCarousel albums={sortAlbums(compilations)} />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function AlbumCarousel({ albums }: { albums: DeezerArtistAlbum[] }) {
  if (albums.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No items found</p>
  }

  return (
    <div className="relative px-12 mt-4">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {albums.map((album) => {
            const year = getYearFromReleaseDate(album.release_date)

            return (
              <CarouselItem
                key={album.id}
                className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
              >
                <Link href={`/album/${album.id}`} className="group block space-y-2">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border group-hover:border-primary transition-colors">
                    <img
                      src={album.cover_medium || album.cover_big || "/placeholder.svg"}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {album.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {year > 0 ? year : "Unknown"}
                    </p>
                  </div>
                </Link>
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}
