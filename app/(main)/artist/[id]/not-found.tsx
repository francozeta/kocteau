import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export default function ArtistNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <User className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Artist Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        {"We couldn't find this artist. They may have been removed or the link might be incorrect."}
      </p>
      <Button asChild>
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  )
}
