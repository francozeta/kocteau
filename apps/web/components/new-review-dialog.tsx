"use client";

import {
  cloneElement,
  isValidElement,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from "react";
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
import { toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type InitialSelection = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
};

export default function NewReviewDialog({
  isAuthenticated = true,
  triggerClassName,
  triggerLabelClassName,
  trigger,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  initialQuery,
  initialSelection,
  redirectToOnSuccess = null,
}: {
  isAuthenticated?: boolean;
  triggerClassName?: string;
  triggerLabelClassName?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialQuery?: string;
  initialSelection?: InitialSelection | null;
  redirectToOnSuccess?: string | null;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const usesUrlComposeState = initialQuery === undefined && initialSelection === undefined;
  const shouldOpenFromUrl = usesUrlComposeState && searchParams.get("compose") === "1";
  const initialQueryFromUrl = useMemo(() => searchParams.get("reviewQuery")?.trim() ?? "", [searchParams]);
  const initialSelectionFromUrl = useMemo(() => {
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
      entity_id: null,
    } satisfies InitialSelection;
  }, [searchParams]);
  const resolvedInitialQuery = initialQuery ?? initialQueryFromUrl;
  const resolvedInitialSelection = initialSelection ?? initialSelectionFromUrl;

  const clearComposeParams = useCallback(() => {
    if (!usesUrlComposeState) {
      return;
    }

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
  }, [pathname, router, searchParams, usesUrlComposeState]);

  function handleOpenChange(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);

    if (!nextOpen && shouldOpenFromUrl) {
      clearComposeParams();
    }
  }

  useEffect(() => {
    if (!shouldOpenFromUrl || isAuthenticated) {
      return;
    }

    toastAuthRequired("create-review");
    clearComposeParams();
  }, [clearComposeParams, isAuthenticated, shouldOpenFromUrl]);

  const resolvedOpen = isAuthenticated && (controlledOpen ?? (shouldOpenFromUrl || internalOpen));

  const baseTrigger = trigger ?? (
    <Button
      size="sm"
      className={cn(
        "shrink-0 gap-2 bg-foreground text-background hover:bg-foreground/90",
        triggerClassName,
      )}
    >
      <Plus className="w-4 h-4" />
      <span className={cn("hidden sm:inline", triggerLabelClassName)}>New review</span>
    </Button>
  );

  const resolvedTrigger = !isAuthenticated && isValidElement(baseTrigger)
    ? cloneElement(
        baseTrigger as ReactElement<{
          onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
        }>,
        {
          onClick: (event: ReactMouseEvent<HTMLElement>) => {
            const originalOnClick = (
              baseTrigger.props as { onClick?: (event: ReactMouseEvent<HTMLElement>) => void }
            ).onClick;
            originalOnClick?.(event);

            if (!event.defaultPrevented) {
              toastAuthRequired("create-review");
            }
          },
        },
      )
    : baseTrigger;

  if (!isAuthenticated) {
    return <>{resolvedTrigger}</>;
  }

  if (isMobile) {
    return (
      <Drawer open={resolvedOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{resolvedTrigger}</DrawerTrigger>

        <DrawerContent className="flex h-[92vh] max-h-[92vh] flex-col rounded-t-2xl border-border/30">
          <DrawerHeader className="border-b border-border/30 pb-3 text-left">
            <DrawerTitle className="font-serif text-2xl">New review</DrawerTitle>
            <DrawerDescription className="sr-only">
              Create or publish a review.
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-hidden">
            <NewReviewForm
              initialQuery={resolvedInitialQuery}
              initialSelection={resolvedInitialSelection}
              redirectToOnSuccess={redirectToOnSuccess}
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

      <DialogContent className="flex h-[min(90vh,56rem)] w-[min(100vw-1.5rem,52rem)] flex-col overflow-hidden border-border/30 p-0">
        <DialogHeader className="border-b border-border/30 px-6 py-4">
          <DialogTitle className="font-serif text-2xl">New review</DialogTitle>
          <DialogDescription className="sr-only">
            Create or publish a review.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          <NewReviewForm
            initialQuery={resolvedInitialQuery}
            initialSelection={resolvedInitialSelection}
            redirectToOnSuccess={redirectToOnSuccess}
            onSuccess={() => handleOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
