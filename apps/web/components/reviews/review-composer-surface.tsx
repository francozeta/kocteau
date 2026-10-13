"use client";

import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { X } from "@/components/ui/icons";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";

export default function ReviewComposerSurface({
  open, onOpenChange, trigger, title, description, closeLabel,
  leadingAction, trackAction, progress, children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description: string;
  closeLabel: string;
  leadingAction?: ReactNode;
  trackAction?: ReactNode;
  progress?: ReactNode;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const closeButton = (
    <Button
      type="button" variant="ghost" onClick={() => onOpenChange(false)}
      className="size-10 shrink-0 rounded-md text-muted-foreground hover:bg-foreground/[0.06] md:h-7 md:w-auto md:min-w-8 md:bg-foreground/[0.065] md:px-2 md:text-[10px]"
      aria-label={closeLabel}
    >
      <X className="size-4 md:hidden" />
      <span className="hidden md:inline">Esc</span>
    </Button>
  );
  const header = (
    <div className="relative flex min-h-7 items-center">
      <div className="z-10 flex min-w-9 items-center justify-start">{leadingAction}</div>
      {isMobile ? (
        <DrawerTitle className="pointer-events-none absolute left-1/2 max-w-[62%] -translate-x-1/2 truncate text-center text-sm font-semibold">{title}</DrawerTitle>
      ) : (
        <DialogTitle className="pointer-events-none absolute left-1/2 max-w-[62%] -translate-x-1/2 truncate text-center text-sm font-semibold">{title}</DialogTitle>
      )}
      <div className="z-10 ml-auto flex items-center gap-3">
        {!isMobile ? trackAction : null}
        {progress}
        {closeButton}
      </div>
    </div>
  );
  const body = <div className="min-h-0 flex-1 overflow-hidden">{children}</div>;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false} autoFocus>
        {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
        <DrawerContent className="flex h-[100dvh] min-h-[100svh] max-h-[100dvh] flex-col overflow-hidden rounded-t-[1.1rem] border border-b-0 border-border/24 bg-[var(--kocteau-surface)] p-0 shadow-none before:hidden data-[vaul-drawer-direction=bottom]:inset-0 data-[vaul-drawer-direction=bottom]:bottom-auto data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none">
          <DrawerHeader className="shrink-0 border-b border-border/20 px-4 py-3 text-left">
            {header}
            <DrawerDescription className="sr-only">{description}</DrawerDescription>
          </DrawerHeader>
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent showCloseButton={false} className="flex h-[min(88vh,46rem)] w-[min(100vw-1.5rem,44rem)] flex-col overflow-hidden rounded-[1rem] border border-border/24 bg-[var(--kocteau-surface)] p-0 shadow-none">
        <DialogHeader className="border-b border-border/20 bg-[var(--kocteau-surface)] px-4 py-3">
          {header}
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
