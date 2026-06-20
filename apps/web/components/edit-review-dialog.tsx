"use client";

import { startTransition, useState } from "react";
import { FaDeezer } from "react-icons/fa";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PencilLine } from "@/components/ui/icons";
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
        className={cn("rounded-lg border-border/24 bg-card/12 px-4", triggerClassName)}
      >
        {showDefaultTriggerIcon ? <PencilLine className="size-4" /> : null}
        {triggerLabel}
      </Button>
    );
  const closeButton = (
    <button
      type="button"
      onClick={() => handleOpenChange(false)}
      className="inline-flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-foreground/[0.065] px-2 text-[10px] font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-foreground/[0.11] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      aria-label="Close review editor"
    >
      Esc
    </button>
  );
  const headerTrackAction = initialSelection.deezer_url ? (
    <Button
      asChild
      type="button"
      variant="ghost"
      size="icon"
      className="hidden h-7 w-7 shrink-0 rounded-md bg-foreground/[0.052] text-muted-foreground shadow-none transition-colors hover:bg-foreground/[0.095] hover:text-foreground sm:inline-flex"
    >
      <a href={initialSelection.deezer_url} target="_blank" rel="noreferrer" title="Open on Deezer">
        <FaDeezer className="size-3.5" />
        <span className="sr-only">Open on Deezer</span>
      </a>
    </Button>
  ) : null;

  if (isMobile) {
    return (
      <Drawer open={resolvedOpen} onOpenChange={handleOpenChange} repositionInputs={false}>
        {showTrigger ? <DrawerTrigger asChild>{resolvedTrigger}</DrawerTrigger> : null}

        <DrawerContent className="flex h-[100dvh] min-h-[100svh] max-h-[100dvh] flex-col overflow-hidden rounded-t-[1.1rem] border border-b-0 border-border/24 bg-[var(--kocteau-surface)] p-0 shadow-none before:hidden data-[vaul-drawer-direction=bottom]:inset-0 data-[vaul-drawer-direction=bottom]:bottom-auto data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none">
          <DrawerHeader className="shrink-0 border-b border-border/20 px-4 py-3 text-left">
            <div className="relative flex min-h-7 items-center">
              <DrawerTitle className="pointer-events-none absolute left-1/2 max-w-[62%] -translate-x-1/2 truncate text-center text-sm font-semibold">
                Edit review
              </DrawerTitle>
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
              showCancelAction={false}
              primaryActionFullWidth
              onCancel={() => handleOpenChange(false)}
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

      <DialogContent showCloseButton={false} className="flex h-[min(88vh,46rem)] w-[min(100vw-1.5rem,44rem)] flex-col overflow-hidden rounded-[1rem] border border-border/24 bg-[var(--kocteau-surface)] p-0 shadow-none">
        <DialogHeader className="border-b border-border/20 bg-[var(--kocteau-surface)] px-4 py-3">
          <div className="relative flex min-h-7 items-center">
            <DialogTitle className="pointer-events-none absolute left-1/2 max-w-[62%] -translate-x-1/2 truncate text-center text-sm font-semibold">
              Edit review
            </DialogTitle>
            <div className="z-10 ml-auto flex items-center gap-3">
              {headerTrackAction}
              {closeButton}
            </div>
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
            showCancelAction={false}
            onCancel={() => handleOpenChange(false)}
            onSuccess={() => handleOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
