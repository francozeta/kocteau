"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateReviewModal } from "@/components/create-review-modal"
import { useState } from "react"

export function SiteHeader() {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  return (
    <>
      <header className="flex h-14 shrink-0 items-center border-b border-border/50 bg-background">
        <div className="flex flex-1 items-center gap-2 px-4">
          <SidebarTrigger className="ml-1 " />
          <Separator orientation="vertical" className="mx-2" />
          <span className="text-sm font-medium text-foreground">Feed</span>
        </div>

        <div className="flex items-center gap-2 px-4">
          <Button size="sm" className="gap-1.5 h-8 px-3 rounded-lg" onClick={() => setIsReviewModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Review</span>
          </Button>
        </div>
      </header>

      <CreateReviewModal open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen} />
    </>
  )
}
