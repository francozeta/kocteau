"use client"

import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateReviewModal } from "@/components/create-review-modal"
import { useState } from "react"

export function CreateReviewButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Pencil className="h-4 w-4" />
        Write Review
      </Button>
      <CreateReviewModal open={open} onOpenChange={setOpen} />
    </>
  )
}
