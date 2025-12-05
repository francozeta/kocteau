"use client"

import { Search, Bell, PenSquare } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { WriteReviewDialog } from "@/components/write-review-dialog"

export function Header() {
  const [openReviewDialog, setOpenReviewDialog] = useState(false)

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 h-6" />

        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-lg">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
              <Input 
                placeholder="Search albums, artists, reviews..." 
                className="pl-10 h-10 text-sm bg-muted/50 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setOpenReviewDialog(true)}
            size="sm"
            className="h-9 gap-2 bg-foreground text-background hover:bg-foreground/90 shadow-sm font-medium"
          >
            <PenSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Write Review</span>
            <span className="sm:hidden">Review</span>
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-muted">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="border-b px-4 py-3 bg-muted/30">
                <p className="text-sm font-semibold">Notifications</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 shrink-0 ring-2 ring-background" />
                  <div className="flex-1 text-sm min-w-0">
                    <p className="truncate">
                      <span className="font-semibold">Rina</span> liked your review
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">9m ago</p>
                  </div>
                </div>
                <div className="flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-300 shrink-0 ring-2 ring-background" />
                  <div className="flex-1 text-sm min-w-0">
                    <p className="truncate">
                      <span className="font-semibold">Jordan</span> commented on your review
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">1h ago</p>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <WriteReviewDialog
        open={openReviewDialog}
        onOpenChange={setOpenReviewDialog}
      />
    </>
  )
}
