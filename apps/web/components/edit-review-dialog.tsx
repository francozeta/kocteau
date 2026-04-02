"use client";

import { startTransition, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PencilLine } from "lucide-react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import NewReviewForm from "@/components/new-review-form";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export type EditReviewSelection = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id: string;
};

export type EditReviewDialogSeed = {
  initialSelection: EditReviewSelection;
  initialTitle?: string;
  initialBody?: string;
  initialRating?: number | null;
  initialPinned?: boolean;
};

type EditReviewDialogProps = {
  reviewId: string;
  trigger?: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  triggerSize?: VariantProps<typeof buttonVariants>["size"];
  showDefaultTriggerIcon?: boolean;
  showTrigger?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dismissSearchParam?: string | null;
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
  triggerLabel = "Edit review",
  triggerVariant = "outline",
  triggerSize = "sm",
  showDefaultTriggerIcon = false,
  showTrigger = true,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  dismissSearchParam = null,
  initialSelection,
  initialTitle = "",
  initialBody = "",
  initialRating = null,
  initialPinned = false,
}: EditReviewDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedOpen = controlledOpen ?? internalOpen;

  function handleOpenChange(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);

    if (!nextOpen && dismissSearchParam && searchParams.has(dismissSearchParam)) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete(dismissSearchParam);

      startTransition(() => {
        router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, {
          scroll: false,
        });
      });
    }
  }

  const resolvedTrigger =
    trigger ?? (
      <Button
        variant={triggerVariant}
        size={triggerSize}
        className={cn("rounded-full border-border/24 bg-card/12 px-4", triggerClassName)}
      >
        {showDefaultTriggerIcon ? <PencilLine className="size-4" /> : null}
        {triggerLabel}
      </Button>
    );

  if (isMobile) {
    return (
      <Drawer open={resolvedOpen} onOpenChange={handleOpenChange}>
        {showTrigger ? <DrawerTrigger asChild>{resolvedTrigger}</DrawerTrigger> : null}

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
      {showTrigger ? <DialogTrigger asChild>{resolvedTrigger}</DialogTrigger> : null}

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
