import SearchClient from "@/components/search-client"
import { Suspense } from "react"

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search tracks from Deezer and open the track page.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
            Loading search…
          </div>
        }
      >
        <SearchClient />
      </Suspense>
    </div>
  )
}
