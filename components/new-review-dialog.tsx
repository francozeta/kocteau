"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { Plus } from "lucide-react";

type InitialSelection = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
};

export default function NewReviewDialog() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenFromUrl = searchParams.get("compose") === "1";
  const initialQuery = useMemo(() => searchParams.get("reviewQuery")?.trim() ?? "", [searchParams]);
  const initialSelection = useMemo(() => {
    const provider = searchParams.get("composeProvider");
    const providerId = searchParams.get("composeProviderId");
    const title = searchParams.get("composeTitle");

    if (provider !== "deezer" || !providerId || !title) {
      return null;
    }

    return {
      provider: "deezer" as const,
      provider_id: providerId,
      type: "track" as const,
      title,
      artist_name: searchParams.get("composeArtist"),
      cover_url: searchParams.get("composeCover"),
      deezer_url: searchParams.get("composeDeezer"),
    } satisfies InitialSelection;
  }, [searchParams]);

  useEffect(() => {
    if (shouldOpenFromUrl) {
      setOpen(true);
    }
  }, [shouldOpenFromUrl]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && shouldOpenFromUrl) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("compose");
      next.delete("reviewQuery");
      next.delete("composeProvider");
      next.delete("composeProviderId");
      next.delete("composeTitle");
      next.delete("composeArtist");
      next.delete("composeCover");
      next.delete("composeDeezer");

      startTransition(() => {
        router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, {
          scroll: false,
        });
      });
    }
  }

  const trigger = (
    <Button size="sm" className="shrink-0 gap-2">
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">Add review</span>
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>

        <DrawerContent className="flex h-[92vh] max-h-[92vh] flex-col rounded-t-2xl border-border/60">
          <DrawerHeader className="border-b border-border/40 pb-3 text-left">
            <DrawerTitle>Write a Review</DrawerTitle>
            <DrawerDescription>
              Search for a track, rate it, and share your thoughts with the community.
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-hidden">
            <NewReviewForm
              initialQuery={initialQuery}
              initialSelection={initialSelection}
              onSuccess={() => handleOpenChange(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="flex h-[min(90vh,56rem)] w-[min(100vw-1.5rem,52rem)] flex-col overflow-hidden border-border/40 p-0">
        <DialogHeader className="border-b border-border/40 px-6 py-4">
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Search for a track, rate it, and share your thoughts with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          <NewReviewForm
            initialQuery={initialQuery}
            initialSelection={initialSelection}
            onSuccess={() => handleOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
