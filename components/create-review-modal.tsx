"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DeezerTrack } from "@/lib/deezer"

interface CreateReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function RatingSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium text-foreground">Rating</Label>
        <p className="text-xs text-muted-foreground">How did it hit you?</p>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={cn(
              "h-10 rounded-lg text-sm font-medium transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              value === num ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  )
}

function TrackSearch({
  selectedTrack,
  onSelectTrack,
  onClearTrack,
}: {
  selectedTrack: DeezerTrack | null
  onSelectTrack: (track: DeezerTrack) => void
  onClearTrack: () => void
}) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<DeezerTrack[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showResults, setShowResults] = React.useState(false)
  const searchRef = React.useRef<HTMLDivElement>(null)

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/deezer/search?q=${encodeURIComponent(query)}&limit=6`)
        const data = await res.json()
        setResults(data.data || [])
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (selectedTrack) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
        <img
          src={selectedTrack.album.cover_medium || "/placeholder.svg"}
          alt={selectedTrack.album.title}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-foreground">{selectedTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {selectedTrack.artist.name} · {selectedTrack.album.title}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onClearTrack}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for a track..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="pl-10 h-11 rounded-xl bg-muted border-border"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-popover border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => {
                onSelectTrack(track)
                setQuery("")
                setShowResults(false)
              }}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <img
                src={track.album.cover_small || "/placeholder.svg"}
                alt={track.album.title}
                className="w-10 h-10 rounded-md object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewForm({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = React.useState(7)
  const [selectedTrack, setSelectedTrack] = React.useState<DeezerTrack | null>(null)
  const [reviewText, setReviewText] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle form submission with server action
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Track Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Track</Label>
        <TrackSearch
          selectedTrack={selectedTrack}
          onSelectTrack={setSelectedTrack}
          onClearTrack={() => setSelectedTrack(null)}
        />
      </div>

      {/* Rating */}
      <RatingSelector value={rating} onChange={setRating} />

      {/* Review Text */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Your Review</Label>
        <Textarea
          placeholder="What worked? What didn't? Production, vocals, lyrics..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="min-h-30 rounded-xl bg-muted border-border resize-none whitespace-pre-wrap break-all"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Short or long reviews are welcome</p>
          <p className="text-xs text-muted-foreground tabular-nums">{reviewText.length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="ghost" className="flex-1 h-11 rounded-xl" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90"
          disabled={!selectedTrack}
        >
          Publish
        </Button>
      </div>
    </form>
  )
}

export function CreateReviewModal({ open, onOpenChange }: CreateReviewModalProps) {
  const isMobile = useIsMobile()
  const handleClose = () => onOpenChange(false)

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left px-0 pt-6 pb-4">
            <DrawerTitle className="text-xl font-semibold">Create Review</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              Share your thoughts on a track you love (or hate)
            </DrawerDescription>
          </DrawerHeader>
          <ReviewForm onClose={handleClose} />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 gap-0" showCloseButton={false}>
        <DialogHeader className="pb-5 space-y-1.5">
          <DialogTitle className="text-xl font-semibold">Create Review</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share your thoughts on a track you love (or hate)
          </DialogDescription>
        </DialogHeader>
        <ReviewForm onClose={handleClose} />
      </DialogContent>
    </Dialog>
  )
}
