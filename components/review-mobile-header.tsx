"use client";

import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import ReviewActionsMenu from "@/components/review-actions-menu";
import { Button } from "@/components/ui/button";

type ReviewMobileHeaderProps = {
  reviewId: string;
  reviewTitle: string | null;
  entityTitle: string | null;
  entityId?: string | null;
  canManage?: boolean;
  fallbackHref: string;
};

export default function ReviewMobileHeader({
  reviewId,
  reviewTitle,
  entityTitle,
  entityId = null,
  canManage = false,
  fallbackHref,
}: ReviewMobileHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-border/25 bg-background/72 backdrop-blur-xl md:hidden">
      <div className="relative flex h-15 items-center justify-between gap-3 px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          onClick={handleBack}
          className="size-10 rounded-full border border-border/40 bg-background/65 text-muted-foreground shadow-none hover:bg-muted/40 hover:text-foreground"
          aria-label="Go back"
        >
          <ChevronLeft className="size-[1.15rem]" />
        </Button>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <span className="px-12 text-sm font-medium text-foreground/88">Review</span>
        </div>

        <ReviewActionsMenu
          reviewId={reviewId}
          reviewTitle={reviewTitle}
          entityTitle={entityTitle}
          entityId={entityId}
          canManage={canManage}
          trigger={
            <button
              type="button"
              aria-label="Review actions"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border/40 bg-background/65 text-muted-foreground shadow-none transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <MoreHorizontal className="size-[1.1rem]" />
            </button>
          }
        />
      </div>
    </div>
  );
}
