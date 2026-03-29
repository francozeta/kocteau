"use client";

import { startTransition, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import NewReviewForm from "@/components/new-review-form";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type EditReviewSelection = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id: string;
};

type EditReviewDialogProps = {
  reviewId: string;
  trigger?: React.ReactNode;
  triggerClassName?: string;
  initialSelection: EditReviewSelection;
  initialTitle?: string;
  initialBody?: string;
  initialRating?: number | null;
  initialPinned?: boolean;
};

export default function EditReviewDialog({
  reviewId,
  trigger,
  triggerClassName,
  initialSelection,
  initialTitle = "",
  initialBody = "",
  initialRating = null,
  initialPinned = false,
}: EditReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenFromUrl = searchParams.get("edit") === "1";

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && shouldOpenFromUrl) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("edit");

      startTransition(() => {
        router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, {
          scroll: false,
        });
      });
    }
  }

  const resolvedOpen = shouldOpenFromUrl || open;

  const resolvedTrigger =
    trigger ?? (
      <Button
        variant="outline"
        size="sm"
        className={cn("rounded-full border-border/24 bg-card/12 px-4", triggerClassName)}
      >
        Edit review
      </Button>
    );

  if (isMobile) {
    return (
      <Drawer open={resolvedOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{resolvedTrigger}</DrawerTrigger>

        <DrawerContent className="flex h-[94vh] max-h-[94vh] flex-col rounded-t-[1.5rem] border-border/24 bg-background/96 p-0">
          <DrawerHeader className="border-b border-border/20 px-4 py-3 text-left">
            <div className="flex items-center justify-between gap-3">
              <DrawerTitle className="text-base font-medium text-foreground">Edit review</DrawerTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full px-3 text-muted-foreground hover:text-foreground"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
            <DrawerDescription className="sr-only">Edit your review.</DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-hidden">
            <NewReviewForm
              mode="edit"
              reviewId={reviewId}
              initialSelection={initialSelection}
              initialTitle={initialTitle}
              initialBody={initialBody}
              initialRating={initialRating}
              initialPinned={initialPinned}
              onSuccess={() => handleOpenChange(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{resolvedTrigger}</DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="flex h-[min(88vh,54rem)] w-[min(100vw-1.5rem,48rem)] flex-col overflow-hidden rounded-[1.55rem] border border-border/24 bg-background/98 p-0"
      >
        <DialogHeader className="border-b border-border/20 px-4 py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-self-start rounded-full px-3 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </DialogClose>

            <DialogTitle className="text-center text-base font-medium text-foreground">
              Edit review
            </DialogTitle>

            <div className="justify-self-end" />
          </div>
          <DialogDescription className="sr-only">Edit your review.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          <NewReviewForm
            mode="edit"
            reviewId={reviewId}
            initialSelection={initialSelection}
            initialTitle={initialTitle}
            initialBody={initialBody}
            initialRating={initialRating}
            initialPinned={initialPinned}
            onSuccess={() => handleOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
