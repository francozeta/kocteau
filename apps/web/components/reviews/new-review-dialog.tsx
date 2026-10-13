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
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { NewReviewFormProps, NewReviewFormStep } from "@/components/reviews/new-review-form";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewComposerSession } from "./review-composer-session";
import ReviewComposerSurface from "./review-composer-surface";
import {
  ComposeChevronLeftIcon,
  ComposeDesktopChevronLeftIcon,
  Search,
} from "@/components/ui/icons";
import { readPendingReviewDraft, type StoredPendingReviewDraft } from "@/lib/pending-review-draft";
import { cn } from "@/lib/utils";
import ReviewGlyphIcon from "@/components/icons/review-glyph-icon";

const NewReviewForm = dynamic<NewReviewFormProps>(
  () => import("@/components/reviews/new-review-form"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[20rem] flex-col gap-6 p-5" aria-hidden="true">
        <Skeleton className="h-11 w-full animate-none" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-16 shrink-0 animate-none rounded-lg" />
          <Skeleton className="h-4 w-40 animate-none" />
        </div>
        <Skeleton className="h-7 w-36 animate-none" />
        <Skeleton className="h-32 w-full animate-none" />
      </div>
    ),
  },
);

type InitialSelection = NonNullable<NewReviewFormProps["initialSelection"]>;

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
  const [headerSelection, setHeaderSelection] = useState<InitialSelection | null>(resolvedInitialSelection);
  const headerBackActionRef = useRef<(() => void) | null>(null);
  const dialogTitle = isSearchIntent ? "Search" : formStep === "search" ? "Find a track" : "Write review";
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

  const handleSelectionChange = useCallback((selection: InitialSelection | null) => {
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

  const resolvedTrigger = trigger ?? (
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

  const formProps: NewReviewFormProps = {
    intent,
    isAuthenticated,
    onBackActionChange: handleBackActionChange,
    onSelectionChange: handleSelectionChange,
    onStepChange: setFormStep,
    showCancelAction: false,
    initialQuery: resolvedInitialQuery,
    initialSelection: resolvedInitialSelection,
    initialRating: resolvedInitialRating,
    initialTitle: resolvedInitialTitle,
    initialBody: resolvedInitialBody,
    redirectToOnSuccess,
    onSearchResultOpen: () => handleOpenChange(false),
    onCancel: () => handleOpenChange(false),
    onSuccess: (payload) => {
      handleOpenChange(false);
      onSuccess?.(payload);
    },
  };

  return (
    <ReviewComposerSession open={resolvedOpen} initial={formProps}>
      <ReviewComposerSurface
        open={resolvedOpen}
        onOpenChange={handleOpenChange}
        trigger={showTrigger ? resolvedTrigger : undefined}
        title={dialogTitle}
        description={isSearchIntent ? "Search for tracks on Kocteau." : "Create or publish a review."}
        closeLabel="Close review composer"
        leadingAction={headerBackButton}
        trackAction={headerTrackAction}
        progress={!isSearchIntent ? renderStepDots() : null}
      >
        <NewReviewForm {...formProps} />
      </ReviewComposerSurface>
    </ReviewComposerSession>
  );
}
