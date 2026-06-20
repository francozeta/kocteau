"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { FaDeezer } from "react-icons/fa";
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
import {
  ComposeChevronLeftIcon,
  ComposeDesktopChevronLeftIcon,
  Search,
} from "@/components/ui/icons";
import { readPendingReviewDraft, type StoredPendingReviewDraft } from "@/lib/pending-review-draft";
import { cn } from "@/lib/utils";
import ReviewGlyphIcon from "@/components/review-glyph-icon";

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

type HeaderSelection = NonNullable<NewReviewFormProps["initialSelection"]>;
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
  listenToComposeUrl = !showTrigger,
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
  trigger?: ReactNode;
  showTrigger?: boolean;
  listenToComposeUrl?: boolean;
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
  const isSearchIntent = intent === "search";
  const usesUrlComposeState =
    listenToComposeUrl && !isSearchIntent && initialQuery === undefined && initialSelection === undefined;
  const shouldOpenFromUrl = usesUrlComposeState && searchParams.get("compose") === "1";
  const shouldRestoreDraftFromUrl = shouldOpenFromUrl && searchParams.get("draft") === "review";
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
  const [restoredDraft, setRestoredDraft] = useState<StoredPendingReviewDraft | null>(null);
  const resolvedInitialQuery = initialQuery ?? initialQueryFromUrl;
  const resolvedInitialSelection =
    initialSelection ?? initialSelectionFromUrl ?? restoredDraft?.selection ?? null;
  const resolvedInitialRating = restoredDraft?.rating ?? null;
  const resolvedInitialTitle = restoredDraft?.title ?? "";
  const resolvedInitialBody = restoredDraft?.body ?? "";
  const [formStep, setFormStep] = useState<NewReviewFormStep>(
    isSearchIntent ? "search" : resolvedInitialSelection ? "compose" : "search",
  );
  const [headerSelection, setHeaderSelection] = useState<HeaderSelection | null>(resolvedInitialSelection);
  const headerBackActionRef = useRef<(() => void) | null>(null);
  const dialogTitle = isSearchIntent ? "Search" : formStep === "search" ? "Find a track" : "Write review";
  const resolvedTriggerShortcut =
    triggerShortcut === undefined && triggerVariant === "search" && !isSearchIntent
      ? "C"
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
    next.delete("draft");

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
      setHeaderSelection(resolvedInitialSelection);
    }

    onOpenChange?.(nextOpen);

    if (!nextOpen && shouldOpenFromUrl) {
      clearComposeParams();
    }
  }

  const handleSelectionChange = useCallback((selection: HeaderSelection | null) => {
    setHeaderSelection(selection);
  }, []);

  const handleBackActionChange = useCallback((action: (() => void) | null) => {
    headerBackActionRef.current = action;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRestoredDraft(shouldRestoreDraftFromUrl ? readPendingReviewDraft() : null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [shouldRestoreDraftFromUrl]);

  const resolvedOpen = shouldOpenFromUrl || (controlledOpen ?? internalOpen);

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
                "block size-1.5 rounded-full bg-foreground/18 transition-colors",
                isActive && "w-4 bg-foreground/82",
              )}
            />
          );
        })}
      </div>
    );
  }

  const baseTrigger = trigger ?? (
    triggerVariant === "search" ? (
      <button
        type="button"
        className={cn(
          "kocteau-control-surface flex h-10 w-full items-center gap-2.5 rounded-[var(--kocteau-radius-control)] px-3.5 text-left text-muted-foreground/88 hover:text-foreground",
          triggerClassName,
        )}
      >
        <Search className="size-3.5 shrink-0 text-muted-foreground/78" />
        <span className={cn("min-w-0 flex-1 truncate text-[13px]", triggerLabelClassName)}>
          {triggerLabel ?? "Find a track to review…"}
        </span>
        {resolvedTriggerShortcut ? (
          <Kbd className="ml-auto h-5 shrink-0 rounded-md border-transparent bg-foreground/[0.055] px-1.5 text-[0.6rem] text-muted-foreground/90">
            {resolvedTriggerShortcut}
          </Kbd>
        ) : null}
      </button>
    ) : (
      <Button
        size="sm"
        className={cn(
          "shrink-0 gap-2 bg-foreground text-background hover:bg-foreground/90",
          triggerClassName,
        )}
      >
        <ReviewGlyphIcon className="size-4" />
        <span className={cn("hidden sm:inline", triggerLabelClassName)}>
          {triggerLabel ?? "New review"}
        </span>
      </Button>
    )
  );

  const resolvedTrigger = baseTrigger;
  const closeButton = (
    <button
      type="button"
      onClick={() => handleOpenChange(false)}
      className="inline-flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-foreground/[0.065] px-2 text-[10px] font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-foreground/[0.11] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      aria-label="Close review composer"
    >
      Esc
    </button>
  );
  const headerTrackAction =
    !isSearchIntent && formStep === "compose" && headerSelection?.deezer_url ? (
      <Button
        asChild
        type="button"
        variant="ghost"
        size="icon"
        className="hidden h-7 w-7 shrink-0 rounded-md bg-foreground/[0.052] text-muted-foreground shadow-none transition-colors hover:bg-foreground/[0.095] hover:text-foreground sm:inline-flex"
      >
        <a href={headerSelection.deezer_url} target="_blank" rel="noreferrer" title="Open on Deezer">
          <FaDeezer className="size-3.5" />
          <span className="sr-only">Open on Deezer</span>
        </a>
      </Button>
    ) : null;
  const showHeaderBackAction = !isSearchIntent && formStep === "compose" && !resolvedInitialSelection;
  const headerBackButton = showHeaderBackAction ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => headerBackActionRef.current?.()}
      className="h-7 w-7 shrink-0 rounded-md text-muted-foreground shadow-none hover:bg-foreground/[0.06] hover:text-foreground"
      aria-label="Back to track search"
    >
      <ComposeChevronLeftIcon className="size-4 sm:hidden" />
      <ComposeDesktopChevronLeftIcon className="hidden size-4 sm:block" />
    </Button>
  ) : null;

  if (isMobile) {
    return (
      <Drawer open={resolvedOpen} onOpenChange={handleOpenChange} repositionInputs={false}>
        {showTrigger ? <DrawerTrigger asChild>{resolvedTrigger}</DrawerTrigger> : null}

        <DrawerContent className="flex h-[100dvh] min-h-[100svh] max-h-[100dvh] flex-col overflow-hidden rounded-t-[1.1rem] border border-b-0 border-border/24 bg-[var(--kocteau-surface)] p-0 shadow-none before:hidden data-[vaul-drawer-direction=bottom]:inset-0 data-[vaul-drawer-direction=bottom]:bottom-auto data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none">
          <div className="flex h-full min-h-0 flex-col">
            <DrawerHeader className="shrink-0 border-b border-border/20 px-4 py-3 text-left">
              <div className="relative flex min-h-7 items-center">
                <div className="z-10 flex min-w-9 items-center justify-start">
                  {headerBackButton}
                </div>
                <DrawerTitle className="pointer-events-none absolute left-1/2 max-w-[62%] -translate-x-1/2 truncate text-center text-sm font-semibold">
                  {dialogTitle}
                </DrawerTitle>
                <div className="z-10 ml-auto flex items-center gap-3">
                  {!isSearchIntent ? renderStepDots() : null}
                </div>
              </div>
              <DrawerDescription className="sr-only">
                {isSearchIntent ? "Search for tracks on Kocteau." : "Create or publish a review."}
              </DrawerDescription>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-hidden">
              <NewReviewForm
                intent={intent}
                isAuthenticated={isAuthenticated}
                onBackActionChange={handleBackActionChange}
                onSelectionChange={handleSelectionChange}
                onStepChange={setFormStep}
                showCancelAction={false}
                primaryActionFullWidth
                initialQuery={resolvedInitialQuery}
                initialSelection={resolvedInitialSelection}
                initialRating={resolvedInitialRating}
                initialTitle={resolvedInitialTitle}
                initialBody={resolvedInitialBody}
                redirectToOnSuccess={redirectToOnSuccess}
                onSearchResultOpen={() => handleOpenChange(false)}
                onCancel={() => handleOpenChange(false)}
                onSuccess={(payload) => {
                  handleOpenChange(false);
                  onSuccess?.(payload);
                }}
              />
            </div>
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
        className="flex h-[min(88vh,46rem)] w-[min(100vw-1.5rem,44rem)] flex-col overflow-hidden rounded-[1rem] border border-border/24 bg-[var(--kocteau-surface)] p-0 shadow-none"
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-b border-border/20 bg-[var(--kocteau-surface)] px-4 py-3">
            <div className="relative flex min-h-7 items-center">
              <div className="z-10 flex min-w-9 items-center justify-start">
                {headerBackButton}
              </div>
              <DialogTitle className="pointer-events-none absolute left-1/2 max-w-[62%] -translate-x-1/2 truncate text-center text-sm font-semibold">
                {dialogTitle}
              </DialogTitle>
              <div className="z-10 ml-auto flex items-center gap-3">
                {headerTrackAction}
                {!isSearchIntent ? renderStepDots() : null}
                {closeButton}
              </div>
            </div>
            <DialogDescription className="sr-only">
              {isSearchIntent ? "Search for tracks on Kocteau." : "Create or publish a review."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-hidden">
            <NewReviewForm
              intent={intent}
              isAuthenticated={isAuthenticated}
              onBackActionChange={handleBackActionChange}
              onSelectionChange={handleSelectionChange}
              onStepChange={setFormStep}
              showCancelAction={false}
              initialQuery={resolvedInitialQuery}
              initialSelection={resolvedInitialSelection}
              initialRating={resolvedInitialRating}
              initialTitle={resolvedInitialTitle}
              initialBody={resolvedInitialBody}
              redirectToOnSuccess={redirectToOnSuccess}
              onSearchResultOpen={() => handleOpenChange(false)}
              onCancel={() => handleOpenChange(false)}
              onSuccess={(payload) => {
                handleOpenChange(false);
                onSuccess?.(payload);
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
