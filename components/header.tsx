"use client"

import { Search, Bell, PenSquare } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"

export function Header() {
  const [openReviewDialog, setOpenReviewDialog] = useState(false)
  const [rating, setRating] = useState([7])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-sm">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8 h-8 text-sm bg-transparent" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setOpenReviewDialog(true)}
            size="sm"
            className="h-8 gap-1.5 bg-white text-black hover:bg-white/90"
          >
            <PenSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Review</span>
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">Notifications</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="flex gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p>
                      <span className="font-medium">Rina</span> liked your review
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">9m ago</p>
                  </div>
                </div>
                <div className="flex gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-300 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p>
                      <span className="font-medium">Jordan</span> commented on your review
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">1h ago</p>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <Dialog open={openReviewDialog} onOpenChange={setOpenReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Search album or song</Label>
              <Input placeholder="Search..." className="h-9" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Rating</Label>
                <span className="text-2xl font-bold tabular-nums">{rating[0]}</span>
              </div>
              <Slider value={rating} onValueChange={setRating} min={1} max={10} step={1} className="py-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your thoughts</Label>
              <Textarea placeholder="What did you think?" className="min-h-24 resize-none" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpenReviewDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-white text-black hover:bg-white/90">Post</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
