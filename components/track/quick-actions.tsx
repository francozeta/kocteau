"use client"

import { Share2, ListPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface QuickActionsProps {
  trackId: number
  trackTitle: string
  artistName: string
}

export function QuickActions({ trackId, trackTitle, artistName }: QuickActionsProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/track/${trackId}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${trackTitle} - ${artistName}`,
          url,
        })
        toast.success("Shared successfully!")
      } else {
        await navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard!")
      }
    } catch (err) {
      // User cancelled or error
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Failed to share")
      }
    }
  }

  const handleAddToCollection = () => {
    // TODO: Implement in Phase 2
    toast.info("Add to Collection coming soon!", {
      description: "This feature will be available in the next update.",
    })
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 bg-transparent">
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Button variant="outline" size="sm" onClick={handleAddToCollection} className="gap-2 bg-transparent">
        <ListPlus className="h-4 w-4" />
        Add to Collection
      </Button>
    </div>
  )
}
