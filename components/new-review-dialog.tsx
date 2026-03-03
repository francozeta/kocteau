"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import NewReviewForm from "@/components/new-review-form";

export default function NewReviewDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">New review</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New review</DialogTitle>
        </DialogHeader>

        <NewReviewForm />
      </DialogContent>
    </Dialog>
  );
}