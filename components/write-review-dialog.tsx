"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface WriteReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  songId?: string
  songTitle?: string
}

export function WriteReviewDialog({
  open,
  onOpenChange,
  songId,
  songTitle,
}: WriteReviewDialogProps) {
  const isMobile = useIsMobile()
  const [rating, setRating] = useState([7])
  const [searchQuery, setSearchQuery] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // TODO: Implement server action to create review
    // await createReview({ songId, rating: rating[0], title, body })
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    setIsSubmitting(false)
    onOpenChange(false)
    // Reset form
    setRating([7])
    setTitle("")
    setBody("")
    setSearchQuery("")
  }

  // Rating display - keeping it simple with black/white theme
  const getRatingWeight = (rating: number) => {
    if (rating >= 9) return "font-black"
    if (rating >= 8) return "font-extrabold"
    if (rating >= 7) return "font-bold"
    return "font-semibold"
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Song Search/Selection */}
      <div className="space-y-2">
        <Label htmlFor="song-search" className="text-sm font-medium">
          {songTitle ? "Song" : "Search album or song"}
        </Label>
        {songTitle ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/50">
            <div className="h-12 w-12 rounded bg-muted shrink-0 border border-border" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{songTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Selected song</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                setSearchQuery("")
                // TODO: Clear selected song
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="song-search"
              placeholder="Search for a song or album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-background"
            />
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Rating</Label>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-3xl tabular-nums text-foreground",
                getRatingWeight(rating[0])
              )}
            >
              {rating[0]}
            </span>
            <span className="text-sm text-muted-foreground font-normal">/ 10</span>
          </div>
        </div>
        <div className="px-1">
          <Slider
            value={rating}
            onValueChange={setRating}
            min={1}
            max={10}
            step={1}
            className="py-2"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* Optional Title */}
      <div className="space-y-2">
        <Label htmlFor="review-title" className="text-sm font-medium">
          Title <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="review-title"
          placeholder="Give your review a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-10 bg-background"
          maxLength={100}
        />
      </div>

      {/* Review Body */}
      <div className="space-y-2">
        <Label htmlFor="review-body" className="text-sm font-medium">
          Your thoughts
        </Label>
        <Textarea
          id="review-body"
          placeholder="Share your thoughts about this album or song..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-32 resize-none bg-background"
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {body.length} / 2000
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className="font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !body.trim() || (!songTitle && !searchQuery.trim())}
          className="min-w-24 font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Posting..." : "Post Review"}
        </Button>
      </div>
    </form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left border-b pb-4">
            <DrawerTitle className="text-xl font-bold">Write a Review</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-6">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-bold">Write a Review</DialogTitle>
        </DialogHeader>
        <div className="pt-6">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  )
}

