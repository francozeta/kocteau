"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import NewReviewForm from "@/components/new-review-form";
import { DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function NewReviewDialog() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const trigger = (
    <Button size="sm" className="shrink-0">
      Create review
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>

        <DrawerContent className="flex h-[92vh] max-h-[92vh] flex-col rounded-t-2xl border-border/60">
          <DrawerHeader className="border-b border-border/60 pb-3 text-left">
            <DrawerTitle>Nueva review</DrawerTitle>
            <DrawerDescription>
              Elige un track, dale un rating y publica una nota opcional para que aparezca en el feed.
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
            <NewReviewForm onSuccess={() => setOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="flex h-[min(88vh,44rem)] w-[min(100vw-1.5rem,34rem)] flex-col overflow-hidden border-border/60 p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle>Nueva review</DialogTitle>
          <DialogDescription>
            Elige un track, dale un rating y publica una nota opcional para que aparezca en el feed.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden px-5 pb-5 pt-4">
          <NewReviewForm onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
