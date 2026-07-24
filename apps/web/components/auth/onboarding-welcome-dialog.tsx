"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OnboardingWelcomeDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

export function OnboardingWelcomeDialog({
  open,
  onOpenChange,
  defaultOpen = true,
}: OnboardingWelcomeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const resolvedOpen = open ?? internalOpen;

  function handleOpenChange(nextOpen: boolean) {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-[1.05rem] border-border/35 bg-[var(--kocteau-surface)] p-0 text-foreground shadow-[0_24px_80px_rgba(0,0,0,0.58)]"
      >
        <div className="flex min-h-[12rem] items-center justify-center bg-background">
          <BrandLogo priority iconClassName="h-10 w-10" />
        </div>

        <div className="flex flex-col gap-4 border-t border-border/25 bg-[var(--kocteau-surface)] p-4">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="font-sans text-base font-medium leading-6">
              Welcome to Kocteau
            </DialogTitle>
            <DialogDescription className="text-pretty text-sm leading-5">
              Kocteau is a quiet place to review tracks, shape your taste, and
              find what to hear next through other listeners.
            </DialogDescription>
          </DialogHeader>

          <p className="text-pretty text-sm leading-5 text-foreground">
            Your For You feed is ready. Reviews, saves, and follows will keep
            shaping what it brings back.
          </p>

          <DialogFooter className="block">
            <Button
              type="button"
              className="h-9 w-full rounded-[0.75rem] bg-foreground text-background hover:bg-foreground/90"
              onClick={() => handleOpenChange(false)}
            >
              Get started
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OnboardingWelcomeFromUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldOpen = searchParams.get("welcome") === "kocteau";
  const [open, setOpen] = useState(shouldOpen);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen || !shouldOpen) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("welcome");
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname, {
      scroll: false,
    });
  }

  if (!shouldOpen && !open) {
    return null;
  }

  return <OnboardingWelcomeDialog open={open} onOpenChange={handleOpenChange} />;
}
