import SearchClient from "@/components/search-client"

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search tracks from Deezer and open the track page.
        </p>
      </div>

      <SearchClient />
    </div>
  )
}
