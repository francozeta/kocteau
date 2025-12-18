import Link from "next/link"
import { Music2, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <Music2 className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Track not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md text-balance">
        This track doesn't exist or couldn't be loaded from Deezer. Try searching for another track.
      </p>
      <Button asChild className="gap-2">
        <Link href="/">
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  )
}
