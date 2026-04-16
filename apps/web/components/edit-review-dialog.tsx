"use client";

import { startTransition, useCallback, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PencilLine, X } from "lucide-react";
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
import { Kbd } from "@/components/ui/kbd";
import NewReviewForm, {
  type NewReviewFormActionHandle,
  type NewReviewFormActionState,
} from "@/components/new-review-form";
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
  const mobileActionRef = useRef<NewReviewFormActionHandle | null>(null);
  const [mobileActionState, setMobileActionState] = useState<NewReviewFormActionState>({
    canContinue: Boolean(initialSelection) && initialRating !== null,
    continueLabel: "Save",
    saving: false,
    step: "compose",
  });

  const handleMobileActionStateChange = useCallback((nextState: NewReviewFormActionState) => {
    setMobileActionState(nextState);
  }, []);

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

  if (isMobile) {
    return (
      <Drawer open={resolvedOpen} onOpenChange={handleOpenChange} repositionInputs={false}>
        {showTrigger ? <DrawerTrigger asChild>{resolvedTrigger}</DrawerTrigger> : null}

        <DrawerContent className="flex h-[100dvh] min-h-[100svh] max-h-[100dvh] flex-col overflow-hidden rounded-none border-0 bg-sidebar p-0 before:hidden data-[vaul-drawer-direction=bottom]:inset-0 data-[vaul-drawer-direction=bottom]:bottom-auto data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none [&>div:first-child]:hidden">
          <DrawerHeader className="shrink-0 border-b border-border/30 px-4 py-3 text-left">
            <div className="flex items-center gap-3">
              <DrawerTitle className="min-w-0 flex-1 truncate font-serif text-2xl">Edit review</DrawerTitle>
              <Button
                type="button"
                size="sm"
                onClick={() => mobileActionRef.current?.continue()}
                disabled={!mobileActionState.canContinue}
                className="h-9 rounded-lg bg-white px-3.5 text-sm text-black hover:bg-white/92 disabled:border-border/36 disabled:bg-card/32 disabled:text-muted-foreground"
              >
                {mobileActionState.continueLabel}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleOpenChange(false)}
                disabled={mobileActionState.saving}
                className="size-9 rounded-lg text-muted-foreground hover:bg-card/70 hover:text-foreground"
                aria-label="Close edit review drawer"
              >
                <X className="size-4" />
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
              showCancelAction={false}
              hideFooter
              actionRef={mobileActionRef}
              onActionStateChange={handleMobileActionStateChange}
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

      <DialogContent showCloseButton={false} className="flex h-[min(90vh,56rem)] w-[min(100vw-1.5rem,52rem)] flex-col overflow-hidden border-border/34 bg-sidebar p-0">
        <DialogHeader className="border-b border-border/30 bg-sidebar px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-serif text-2xl">Edit review</DialogTitle>
            <Kbd className="rounded-md border border-border/42 bg-card/42 px-2 text-[0.625rem] text-muted-foreground">
              Esc
            </Kbd>
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
