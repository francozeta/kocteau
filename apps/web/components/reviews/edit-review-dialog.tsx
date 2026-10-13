"use client";

import { startTransition, useState } from "react";
import { FaDeezer } from "react-icons/fa";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PencilLine } from "@/components/ui/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import NewReviewForm from "@/components/reviews/new-review-form";
import { ReviewComposerSession } from "./review-composer-session";
import ReviewComposerSurface from "./review-composer-surface";
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

  const formProps = {
    mode: "edit" as const,
    reviewId,
    initialSelection,
    initialTitle,
    initialBody,
    initialRating,
    initialPinned,
    showCancelAction: false,
    onCancel: () => handleOpenChange(false),
    onSuccess: () => handleOpenChange(false),
  };

  return (
    <ReviewComposerSession open={resolvedOpen} initial={formProps}>
      <ReviewComposerSurface
        open={resolvedOpen}
        onOpenChange={handleOpenChange}
        trigger={showTrigger ? resolvedTrigger : undefined}
        title="Edit review"
        description="Edit your review."
        closeLabel="Close review editor"
        trackAction={headerTrackAction}
      >
        <NewReviewForm {...formProps} />
      </ReviewComposerSurface>
    </ReviewComposerSession>
  );
}
