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
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
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
import { Kbd } from "@/components/ui/kbd";
import type { NewReviewFormProps, NewReviewFormStep } from "@/components/new-review-form";
import { DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, Search } from "lucide-react";
import { toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const NewReviewForm = dynamic<NewReviewFormProps>(
  () => import("@/components/new-review-form"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[20rem] items-center justify-center p-6">
        <div className="size-5 animate-spin rounded-full border border-border/60 border-t-foreground" />
      </div>
    ),
  },
);

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

type NewReviewDialogTriggerVariant = "default" | "search";
type NewReviewDialogIntent = "review" | "search";

export default function NewReviewDialog({
  isAuthenticated = true,
  intent = "review",
  triggerClassName,
  triggerLabelClassName,
  triggerLabel,
  triggerShortcut,
  triggerVariant = "default",
  trigger,
  showTrigger = true,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onSuccess,
  initialQuery,
  initialSelection,
  redirectToOnSuccess = null,
}: {
  isAuthenticated?: boolean;
  intent?: NewReviewDialogIntent;
  triggerClassName?: string;
  triggerLabelClassName?: string;
  triggerLabel?: string;
  triggerShortcut?: ReactNode;
  triggerVariant?: NewReviewDialogTriggerVariant;
  trigger?: React.ReactNode;
  showTrigger?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: NewReviewFormProps["onSuccess"];
  initialQuery?: string;
  initialSelection?: InitialSelection | null;
  redirectToOnSuccess?: string | null;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const isSearchIntent = intent === "search";
  const canOpenDialog = isAuthenticated || isSearchIntent;
  const usesUrlComposeState =
    !isSearchIntent && initialQuery === undefined && initialSelection === undefined;
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
  const [formStep, setFormStep] = useState<NewReviewFormStep>(
    isSearchIntent ? "search" : resolvedInitialSelection ? "compose" : "search",
  );
  const dialogTitle = isSearchIntent ? "Search" : "New review";
  const resolvedTriggerShortcut =
    triggerShortcut === undefined && triggerVariant === "search" && !isSearchIntent
      ? "N"
      : triggerShortcut;

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

    if (nextOpen) {
      setFormStep(isSearchIntent ? "search" : resolvedInitialSelection ? "compose" : "search");
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

  const resolvedOpen = canOpenDialog && (controlledOpen ?? (shouldOpenFromUrl || internalOpen));

  function renderStepDots() {
    return (
      <div className="flex items-center gap-1.5" aria-label={`Step ${formStep === "search" ? 1 : 2} of 2`}>
        {[0, 1].map((index) => {
          const activeIndex = formStep === "search" ? 0 : 1;
          const isActive = index === activeIndex;

          return (
            <span
              key={index}
              className={cn(
                "block size-2 rounded-full bg-white/18 transition-colors",
                isActive && "bg-white",
              )}
            />
          );
        })}
      </div>
    );
  }

  const surfaceMotionTransition = prefersReducedMotion
    ? {
        duration: 0,
      }
    : {
        duration: 0.2,
        ease: "easeOut" as const,
      };

  const baseTrigger = trigger ?? (
    triggerVariant === "search" ? (
      <motion.button
        type="button"
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-[0.95rem] border border-border/55 bg-card/78 px-4 text-left text-muted-foreground/88 transition-colors hover:border-border/75 hover:bg-card hover:text-foreground",
          triggerClassName,
        )}
        whileHover={
          prefersReducedMotion
            ? undefined
            : {
                y: -1,
              }
        }
        whileTap={
          prefersReducedMotion
            ? undefined
            : {
                scale: 0.995,
              }
        }
      >
        <Search className="size-4 shrink-0 text-muted-foreground/78" />
        <span className={cn("min-w-0 flex-1 truncate text-sm", triggerLabelClassName)}>
          {triggerLabel ?? "Find a track to review..."}
        </span>
        {resolvedTriggerShortcut ? (
          <Kbd className="ml-auto h-5 shrink-0 rounded-md border-border/45 bg-muted/24 px-1.5 text-[0.6rem] text-muted-foreground">
            {resolvedTriggerShortcut}
          </Kbd>
        ) : null}
      </motion.button>
    ) : (
      <Button
        size="sm"
        className={cn(
          "shrink-0 gap-2 bg-foreground text-background hover:bg-foreground/90",
          triggerClassName,
        )}
      >
        <Plus className="w-4 h-4" />
        <span className={cn("hidden sm:inline", triggerLabelClassName)}>
          {triggerLabel ?? "New review"}
        </span>
      </Button>
    )
  );

  const resolvedTrigger = !canOpenDialog && isValidElement(baseTrigger)
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

  if (!canOpenDialog) {
    return showTrigger ? <>{resolvedTrigger}</> : null;
  }

  if (isMobile) {
    return (
      <Drawer open={resolvedOpen} onOpenChange={handleOpenChange} repositionInputs={false}>
        {showTrigger ? <DrawerTrigger asChild>{resolvedTrigger}</DrawerTrigger> : null}

        <DrawerContent className="flex h-[100dvh] min-h-[100svh] max-h-[100dvh] flex-col overflow-hidden rounded-t-[1.1rem] border-border/34 p-2 before:rounded-t-[1rem] before:border-border/34 before:bg-sidebar data-[vaul-drawer-direction=bottom]:inset-0 data-[vaul-drawer-direction=bottom]:bottom-auto data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none">
          <motion.div
            className="flex h-full min-h-0 flex-col"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={surfaceMotionTransition}
          >
            <DrawerHeader className="shrink-0 border-b border-border/30 px-4 py-3 text-left">
              <div className="flex items-center justify-between gap-3">
                <DrawerTitle className="font-serif text-2xl">{dialogTitle}</DrawerTitle>
                {!isSearchIntent ? renderStepDots() : null}
              </div>
              <DrawerDescription className="sr-only">
                {isSearchIntent ? "Search for tracks on Kocteau." : "Create or publish a review."}
              </DrawerDescription>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-hidden">
              <NewReviewForm
                intent={intent}
                onStepChange={setFormStep}
                showCancelAction={false}
                primaryActionFullWidth
                initialQuery={resolvedInitialQuery}
                initialSelection={resolvedInitialSelection}
                redirectToOnSuccess={redirectToOnSuccess}
                onSearchResultOpen={() => handleOpenChange(false)}
                onCancel={() => handleOpenChange(false)}
                onSuccess={(payload) => {
                  handleOpenChange(false);
                  onSuccess?.(payload);
                }}
              />
            </div>
          </motion.div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {showTrigger ? <DialogTrigger asChild>{resolvedTrigger}</DialogTrigger> : null}

      <DialogContent
        showCloseButton={false}
        className="flex h-[min(90vh,56rem)] w-[min(100vw-1.5rem,52rem)] flex-col overflow-hidden border-border/34 bg-sidebar p-0"
      >
        <motion.div
          className="flex h-full min-h-0 flex-col"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={surfaceMotionTransition}
        >
          <DialogHeader className="border-b border-border/30 bg-sidebar px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="font-serif text-2xl">{dialogTitle}</DialogTitle>
              <Kbd className="rounded-md border border-border/42 bg-card/42 px-2 text-[0.625rem] text-muted-foreground">
                Esc
              </Kbd>
            </div>
            <DialogDescription className="sr-only">
              {isSearchIntent ? "Search for tracks on Kocteau." : "Create or publish a review."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-hidden">
            <NewReviewForm
              intent={intent}
              onStepChange={setFormStep}
              showCancelAction={false}
              initialQuery={resolvedInitialQuery}
              initialSelection={resolvedInitialSelection}
              redirectToOnSuccess={redirectToOnSuccess}
              onSearchResultOpen={() => handleOpenChange(false)}
              onCancel={() => handleOpenChange(false)}
              onSuccess={(payload) => {
                handleOpenChange(false);
                onSuccess?.(payload);
              }}
            />
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
