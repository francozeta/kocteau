"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ComposeChevronRightIcon, LoaderCircle, Search, TrackDiscIcon, X } from "@/components/ui/icons";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import EntityCoverImage from "@/components/entity-cover-image";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useDeezerSearch } from "@/hooks/use-deezer-search";
import { toastActionSuccess } from "@/lib/feedback";
import {
  clearPendingReviewDraft,
  getPendingReviewDraftLoginPath,
  readPendingReviewDraft,
  savePendingReviewDraft,
} from "@/lib/pending-review-draft";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";
import type { StarterTrack } from "@/lib/starter";
import { cn } from "@/lib/utils";
import { ApiError, createApiError, getFirstFieldError } from "@/lib/validation/errors";
import { createReviewSchema, updateReviewSchema } from "@/lib/validation/schemas";
import {
  getReviewCacheSnapshot,
  restoreReviewCacheSnapshot,
  syncReviewContent,
} from "@/queries/viewer";
import { feedKeys } from "@/queries/feed";
import RatingStars from "./rating-stars";

type DeezerResult = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
};

type ReviewSubmitError = Error & {
  code?: string;
};

export type PublishReviewResponse = {
  ok: boolean;
  reviewId?: string | null;
  entityId?: string | null;
  authorUsername?: string | null;
  creatorPerkUnlocked?: boolean;
};

export type NewReviewFormProps = {
  mode?: "create" | "edit";
  intent?: "review" | "search";
  isAuthenticated?: boolean;
  reviewId?: string | null;
  onSuccess?: (payload: PublishReviewResponse) => void;
  onCancel?: () => void;
  onSearchResultOpen?: () => void;
  onBackActionChange?: (action: (() => void) | null) => void;
  onSelectionChange?: (selection: DeezerResult | null) => void;
  onStepChange?: (step: NewReviewFormStep) => void;
  showCancelAction?: boolean;
  primaryActionFullWidth?: boolean;
  initialQuery?: string;
  initialSelection?: DeezerResult | null;
  initialRating?: number | null;
  initialTitle?: string;
  initialBody?: string;
  initialPinned?: boolean;
  redirectToOnSuccess?: string | null;
};

export type NewReviewFormStep = "search" | "compose";

type ActiveResultState = {
  key: string;
  index: number;
};

function getSelectionKey(selection: DeezerResult | null | undefined) {
  if (!selection) {
    return "none";
  }

  return [
    selection.provider,
    selection.provider_id,
    selection.entity_id ?? "",
    selection.title,
    selection.artist_name ?? "",
  ].join(":");
}

function getNewReviewFormStateKey(props: NewReviewFormProps) {
  return [
    props.mode ?? "create",
    props.intent ?? "review",
    props.reviewId ?? "",
    props.initialQuery ?? "",
    getSelectionKey(props.initialSelection),
    props.initialRating ?? "",
    props.initialTitle ?? "",
    props.initialBody ?? "",
    props.initialPinned ? "pinned" : "unpinned",
  ].join("|");
}

const defaultFallbackSuggestedSearches = [
  "Radiohead",
  "Björk",
  "Frank Ocean",
  "Massive Attack",
  "The Cure",
  "Slowdive",
];

const fallbackSuggestedSearchGroups = [
  defaultFallbackSuggestedSearches,
  ["Cocteau Twins", "Portishead", "FKA twigs", "Beach House", "Sade", "Arca"],
  ["Deftones", "Mazzy Star", "Devon Hendryx", "Erykah Badu", "Slow Pulp", "Aphex Twin"],
];

function starterTrackToResult(track: StarterTrack): DeezerResult | null {
  if (track.provider !== "deezer" || track.type !== "track" || !track.provider_id) {
    return null;
  }

  return {
    provider: "deezer",
    provider_id: track.provider_id,
    type: "track",
    title: track.title,
    artist_name: track.artist_name,
    cover_url: track.cover_url,
    deezer_url: track.deezer_url,
    entity_id: null,
  };
}

function getFallbackSuggestedSearches(seed: string) {
  const seedValue = Array.from(seed).reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return fallbackSuggestedSearchGroups[seedValue % fallbackSuggestedSearchGroups.length] ?? defaultFallbackSuggestedSearches;
}

async function fetchComposeStarterSuggestions(seed: string) {
  const params = new URLSearchParams({
    surface: "app",
    context: `compose:suggested:${seed}`,
    limit: "6",
  });
  const response = await fetch(`/api/starter/rail?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Could not load starter suggestions.");
  }

  const payload = (await response.json()) as { tracks?: StarterTrack[] };

  return (payload.tracks ?? [])
    .map(starterTrackToResult)
    .filter((track): track is DeezerResult => Boolean(track));
}

function TrackResultButton({
  result,
  active = false,
  buttonRef,
  onClick,
}: {
  result: DeezerResult;
  active?: boolean;
  buttonRef?: (node: HTMLButtonElement | null) => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onClick}
      className="group flex min-h-16 w-full items-center gap-3 rounded-[0.72rem] border border-border/20 bg-foreground/[0.028] px-2.5 py-2 text-left transition-[background-color,border-color] duration-150 ease-[var(--kocteau-ease)] hover:border-border/34 hover:bg-foreground/[0.05] data-[active=true]:border-foreground/24 data-[active=true]:bg-foreground/[0.062] sm:min-h-[5rem] sm:rounded-[0.9rem] sm:px-3 sm:py-3"
      data-active={active}
    >
      <EntityCoverImage
        src={result.cover_url}
        alt={result.title}
        sizes="(max-width: 640px) 40px, 48px"
        quality={58}
        className="h-10 w-10 shrink-0 rounded-[0.52rem] bg-muted shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:h-12 sm:w-12 sm:rounded-[0.62rem]"
        iconClassName="size-4"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-foreground sm:text-[13px]">{result.title}</p>
        <p className="truncate text-[11.5px] text-muted-foreground/82 sm:text-xs">
          {result.artist_name ?? "Unknown artist"}
        </p>
        <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/62 sm:mt-1">
          <TrackDiscIcon className="size-3" />
          Track
        </span>
      </div>
      <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.04] text-muted-foreground/48 transition-colors group-hover:bg-foreground/[0.075] group-hover:text-muted-foreground/82 sm:flex">
        <ComposeChevronRightIcon className="size-4" />
      </span>
    </button>
  );
}

function TrackResultSkeleton() {
  return (
    <div className="t-skel min-h-16 sm:min-h-[5rem]" aria-hidden="true">
      <div className="t-skel-skeleton is-pulsing flex min-h-16 items-center gap-3 rounded-[0.72rem] border border-border/18 bg-foreground/[0.025] px-2.5 py-2 sm:min-h-[5rem] sm:rounded-[0.9rem] sm:px-3 sm:py-3">
        <div className="h-10 w-10 shrink-0 rounded-[0.52rem] bg-foreground/[0.075] sm:h-12 sm:w-12 sm:rounded-[0.62rem]" />
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="h-3.5 w-1/2 rounded-full bg-foreground/[0.07]" />
          <div className="h-3 w-1/3 rounded-full bg-foreground/[0.052]" />
        </div>
      </div>
    </div>
  );
}

export default function NewReviewForm(props: NewReviewFormProps) {
  return <NewReviewFormState key={getNewReviewFormStateKey(props)} {...props} />;
}

function NewReviewFormState({
  mode = "create",
  intent = "review",
  isAuthenticated = true,
  reviewId = null,
  onSuccess,
  onCancel,
  onSearchResultOpen,
  onBackActionChange,
  onSelectionChange,
  onStepChange,
  showCancelAction = true,
  primaryActionFullWidth = false,
  initialQuery = "",
  initialSelection = null,
  initialRating = null,
  initialTitle = "",
  initialBody = "",
  initialPinned = false,
  redirectToOnSuccess = null,
}: NewReviewFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isEditMode = mode === "edit" && Boolean(reviewId);
  const isSearchIntent = intent === "search" && !isEditMode;

  const [step, setStep] = useState<NewReviewFormStep>(
    isSearchIntent ? "search" : initialSelection ? "compose" : "search",
  );
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<DeezerResult | null>(initialSelection);
  const [activeResultState, setActiveResultState] = useState<ActiveResultState>({
    key: "",
    index: -1,
  });

  const [rating, setRating] = useState<number | null>(initialRating);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [composeSuggestionSeed] = useState(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID().slice(0, 8);
    }

    return Math.random().toString(36).slice(2, 10);
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    selected?: string;
    rating?: string;
    review_title?: string;
    review_body?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  const searchEnabled = step === "search";
  const normalizedQuery = query.trim();
  const shouldLoadStarterSuggestions =
    searchEnabled && !isEditMode && normalizedQuery.length === 0;
  const fallbackSuggestedSearches = useMemo(
    () => getFallbackSuggestedSearches(composeSuggestionSeed),
    [composeSuggestionSeed],
  );
  const {
    data: suggestedTracks = [],
    isFetching: isFetchingSuggestions,
  } = useQuery({
    queryKey: ["starter", "compose-suggestions", composeSuggestionSeed],
    queryFn: () => fetchComposeStarterSuggestions(composeSuggestionSeed),
    enabled: shouldLoadStarterSuggestions,
    staleTime: 1000 * 60,
  });
  const {
    data,
    isFetching,
    isPlaceholderData,
    error: searchError,
    refetch: retrySearch,
    searchQuery,
    isDebouncingSearch,
  } = useDeezerSearch({
    query,
    type: "track",
    enabled: searchEnabled,
  });
  const hasSearchInput = normalizedQuery.length >= 2;
  const hasFreshSearchResults =
    searchEnabled && hasSearchInput && searchQuery === normalizedQuery && !isPlaceholderData;
  const results = useMemo(
    () => (hasFreshSearchResults ? ((data ?? []) as DeezerResult[]) : []),
    [data, hasFreshSearchResults],
  );
  const showSearchLoading =
    searchEnabled &&
    hasSearchInput &&
    (isDebouncingSearch || isFetching || isPlaceholderData) &&
    results.length === 0;
  const showSearchUpdating =
    searchEnabled && isFetching && !isDebouncingSearch && !isPlaceholderData && results.length > 0;
  const activeResultKey = useMemo(
    () =>
      [
        step,
        normalizedQuery,
        ...results.map((result) => `${result.provider}:${result.provider_id}`),
      ].join("|"),
    [normalizedQuery, results, step],
  );
  const defaultActiveResultIndex =
    step === "search" && normalizedQuery.length >= 2 && results.length > 0 ? 0 : -1;
  const activeResultIndex =
    activeResultState.key === activeResultKey
      ? activeResultState.index
      : defaultActiveResultIndex;

  function setActiveResultIndex(nextIndex: number | ((current: number) => number)) {
    setActiveResultState((current) => {
      const currentIndex =
        current.key === activeResultKey ? current.index : defaultActiveResultIndex;

      return {
        key: activeResultKey,
        index:
          typeof nextIndex === "function" ? nextIndex(currentIndex) : nextIndex,
      };
    });
  }

  useEffect(() => {
    if (activeResultIndex < 0) {
      return;
    }

    resultRefs.current[activeResultIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeResultIndex]);

  useEffect(() => {
    onStepChange?.(step);
  }, [onStepChange, step]);

  useEffect(() => {
    onSelectionChange?.(selected);
  }, [onSelectionChange, selected]);

  function resetAll() {
    setStep(isSearchIntent ? "search" : initialSelection ? "compose" : "search");
    setSelected(isSearchIntent ? null : initialSelection);
    setQuery(initialQuery);
    setRating(initialRating);
    setTitle(initialTitle);
    setBody(initialBody);
    setErrorMsg(null);
    setFieldErrors({});
    setActiveResultIndex(-1);
  }

  const goBackToSearch = useCallback(() => {
    if (isEditMode) {
      return;
    }

    if (initialSelection) {
      setSelected(initialSelection);
      setStep("compose");
      setErrorMsg(null);
      return;
    }

    setSelected(null);
    setStep("search");
    setErrorMsg(null);
  }, [initialSelection, isEditMode]);

  useEffect(() => {
    if (!onBackActionChange) {
      return;
    }

    onBackActionChange(isEditMode ? null : goBackToSearch);

    return () => onBackActionChange(null);
  }, [goBackToSearch, isEditMode, onBackActionChange]);

  function clearSearchQuery() {
    setQuery("");
    setFieldErrors((current) => ({ ...current, selected: undefined }));
    setActiveResultIndex(-1);
  }

  function handleResultSelect(result: DeezerResult) {
    setSelected(result);
    setStep("compose");
    setErrorMsg(null);
    setFieldErrors((current) => ({
      ...current,
      selected: undefined,
    }));
  }

  function getResultHref(result: DeezerResult) {
    return result.entity_id
      ? buildEntityCanonicalPath({
          id: result.entity_id,
          provider: result.provider,
          provider_id: result.provider_id,
          type: result.type,
          title: result.title,
          artist_name: result.artist_name,
        })
      : `/track/deezer/${result.provider_id}`;
  }

  function openTrack(result: DeezerResult) {
    const href = getResultHref(result);

    router.prefetch(href);
    onSearchResultOpen?.();

    startTransition(() => {
      router.push(href);
    });
  }

  function handleCancel() {
    if (saving) {
      return;
    }

    resetAll();
    onCancel?.();
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (normalizedQuery.length < 2 || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((current) =>
        current <= 0 ? results.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeResultIndex >= 0) {
      event.preventDefault();
      const activeResult = results[activeResultIndex];

      if (!activeResult) {
        return;
      }

      if (isSearchIntent) {
        openTrack(activeResult);
        return;
      }

      handleResultSelect(activeResult);
    }
  }

  async function onSubmit() {
    setErrorMsg(null);
    setFieldErrors({});

    if (!selected) {
      setFieldErrors({ selected: isEditMode ? "Track unavailable for this review." : "Select a track before publishing." });
      return;
    }

    const parsed = isEditMode
      ? updateReviewSchema.safeParse({
          review_title: title,
          review_body: body,
          rating,
          is_pinned: initialPinned,
        })
      : createReviewSchema.safeParse({
          provider: selected.provider,
          provider_id: selected.provider_id,
          type: selected.type,
          title: selected.title,
          artist_name: selected.artist_name,
          cover_url: selected.cover_url,
          deezer_url: selected.deezer_url,
          review_title: title,
          review_body: body,
          rating,
        });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        rating: getFirstFieldError(errors, "rating") ?? undefined,
        review_title: getFirstFieldError(errors, "review_title") ?? undefined,
        review_body: getFirstFieldError(errors, "review_body") ?? undefined,
      });
      setErrorMsg(parsed.error.flatten().formErrors[0] ?? null);
      return;
    }

    if (!isAuthenticated && !isEditMode) {
      const draftSaved = savePendingReviewDraft({
        selection: selected,
        rating,
        title,
        body,
      });

      if (!draftSaved) {
        setErrorMsg("We couldn't keep this draft. Please copy it before logging in.");
        return;
      }

      window.location.assign(getPendingReviewDraftLoginPath());
      return;
    }

    const optimisticSnapshot =
      isEditMode && reviewId ? getReviewCacheSnapshot(queryClient) : null;

    if (isEditMode && reviewId) {
      syncReviewContent(queryClient, reviewId, {
        title: parsed.data.review_title ?? null,
        body: parsed.data.review_body ?? null,
        rating: parsed.data.rating,
        is_pinned: parsed.data.is_pinned,
      });
    }

    setSaving(true);

    try {
      const res = await fetch(isEditMode ? `/api/reviews/${reviewId}` : "/api/reviews", {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        throw await createApiError(res, "Something went wrong while publishing.");
      }

      const payload = (await res.json()) as PublishReviewResponse;

      router.prefetch("/");

      const resultTrackHref =
        payload.entityId && selected
          ? buildEntityCanonicalPath({
              id: payload.entityId,
              provider: selected.provider,
              provider_id: selected.provider_id,
              type: selected.type,
              title: selected.title,
              artist_name: selected.artist_name,
            })
          : null;

      if (payload.entityId) {
        router.prefetch(resultTrackHref ?? `/track/${payload.entityId}`);
      }

      if (payload.authorUsername) {
        router.prefetch(`/u/${payload.authorUsername}`);
      }

      const shouldRedirectToCreatedTrack =
        !isEditMode &&
        Boolean(payload.entityId) &&
        selected?.entity_id !== payload.entityId;

      toastActionSuccess(isEditMode ? "Review updated." : "Review published.");
      if (!isEditMode && payload.creatorPerkUnlocked) {
        toast("First Reviewer added", {
          description: "The v0 Builder badge is now tucked into your profile.",
          action: payload.authorUsername
            ? {
                label: "View profile",
                onClick: () => {
                  router.push(`/u/${payload.authorUsername}`);
                },
              }
            : undefined,
        });
      }
      if (!isEditMode) {
        const pendingDraft = readPendingReviewDraft();

        if (
          pendingDraft?.selection.provider === selected.provider &&
          pendingDraft.selection.provider_id === selected.provider_id
        ) {
          clearPendingReviewDraft();
        }
      }
      void queryClient.invalidateQueries({ queryKey: feedKeys.all });
      onSuccess?.(payload);
      resetAll();

      startTransition(() => {
        router.refresh();

        if (redirectToOnSuccess) {
          router.push(redirectToOnSuccess);
        } else if (shouldRedirectToCreatedTrack && payload.entityId) {
          router.push(resultTrackHref ?? `/track/${payload.entityId}`);
        }
      });

      return;
    } catch (error) {
      if (optimisticSnapshot) {
        restoreReviewCacheSnapshot(queryClient, optimisticSnapshot);
      }

      const reviewError = error as ReviewSubmitError | ApiError;

      if (reviewError instanceof ApiError && reviewError.fieldErrors) {
        setFieldErrors({
          rating: getFirstFieldError(reviewError.fieldErrors, "rating") ?? undefined,
          review_title: getFirstFieldError(reviewError.fieldErrors, "review_title") ?? undefined,
          review_body: getFirstFieldError(reviewError.fieldErrors, "review_body") ?? undefined,
        });
      }

      const existingReviewId =
        reviewError instanceof ApiError && typeof reviewError.payload?.reviewId === "string"
          ? reviewError.payload.reviewId
          : null;

      if (reviewError.code === "ALREADY_REVIEWED" && existingReviewId) {
        setErrorMsg(reviewError.message);
        const existingEntityId =
          reviewError instanceof ApiError && typeof reviewError.payload?.entityId === "string"
            ? reviewError.payload.entityId
            : null;

        if (existingEntityId) {
          const existingReviewHref = `${getResultHref({
            ...selected,
            entity_id: existingEntityId,
          })}?editReview=${existingReviewId}`;

          router.prefetch(existingReviewHref);
        }

        toast.error(reviewError.message, {
          action: {
            label: existingEntityId ? "Open track" : "Dismiss",
            onClick: () => {
              if (existingEntityId) {
                router.push(`${getResultHref({
                  ...selected,
                  entity_id: existingEntityId,
                })}?editReview=${existingReviewId}`);
              }
            },
          },
        });
      } else if (reviewError.code === "42501" || reviewError.code === "UNAUTHORIZED") {
        setErrorMsg("Your session expired. Please sign in again.");
      } else {
        setErrorMsg(
          reviewError.message ||
            (isEditMode
              ? "We couldn't update this review right now."
              : "We couldn't publish this review right now."),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const highlightedResult =
    step === "search" && activeResultIndex >= 0 ? (results[activeResultIndex] ?? null) : null;
  const canPublish = Boolean(selected) && rating !== null && !saving;
  const continueLabel = saving
    ? (isEditMode ? "Saving..." : "Publishing...")
    : isEditMode
        ? "Save"
        : "Publish";

  function handleContinue() {
    if (step === "search") {
      if (highlightedResult) {
        if (isSearchIntent) {
          openTrack(highlightedResult);
          return;
        }

        handleResultSelect(highlightedResult);
      }

      return;
    }

    void onSubmit();
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--kocteau-surface)]">
      <div
        className="t-page-slide min-h-0 flex-1 overflow-hidden"
        data-page={step === "search" ? "1" : "2"}
      >
        <section className="t-page flex min-h-0 flex-col px-4 py-4 md:px-5" data-page-id="1">
          <div className="relative mb-4 shrink-0">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground/82" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setFieldErrors((current) => ({ ...current, selected: undefined }));
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search tracks to review…"
              disabled={saving}
              autoFocus
              className="kocteau-compose-search-field h-11 shrink-0 rounded-full pr-12 pl-11 text-[13px] shadow-none placeholder:text-muted-foreground/76 focus-visible:ring-0"
              maxLength={80}
            />
            {query.length > 1 ? (
              <button
                type="button"
                onClick={clearSearchQuery}
                disabled={saving}
                className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-foreground/[0.085] text-muted-foreground transition-[background-color,color] duration-150 ease-[var(--kocteau-ease)] hover:bg-foreground/[0.13] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {errorMsg ? (
            <Alert variant="destructive" className="mb-4 shrink-0">
              <AlertTitle>We could not continue</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          {searchError && hasSearchInput && searchQuery === normalizedQuery ? (
            <Alert className="mb-4 shrink-0 border-border/28 bg-card/22 pr-24 shadow-none">
              <AlertTitle>Music search is slow</AlertTitle>
              <AlertDescription>
                {searchError.message || "Music search is taking longer than usual. Try again in a moment."}
              </AlertDescription>
              <button
                type="button"
                onClick={() => {
                  void retrySearch();
                }}
                disabled={isFetching}
                className="absolute top-1/2 right-2 inline-flex h-7 -translate-y-1/2 items-center rounded-md bg-foreground/[0.065] px-2.5 text-[11px] font-medium text-foreground/88 transition-colors hover:bg-foreground/[0.11] disabled:pointer-events-none disabled:opacity-55"
              >
                {isFetching ? "Retrying" : "Retry"}
              </button>
            </Alert>
          ) : null}
          <FieldError>{fieldErrors.selected}</FieldError>

          <ScrollArea className="kocteau-compose-scroll min-h-0 flex-1">
            <div className="grid gap-1 pr-2 sm:pr-0">
              {showSearchLoading ? (
                <div className="grid gap-1 py-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <TrackResultSkeleton key={index} />
                  ))}
                </div>
              ) : null}

              {showSearchUpdating ? (
                <div className="flex items-center gap-2 rounded-[0.82rem] border border-border/18 bg-foreground/[0.025] px-3 py-3 text-xs text-muted-foreground">
                  <LoaderCircle className="size-3.5 animate-spin" />
                  Updating results…
                </div>
              ) : null}

              {!normalizedQuery && results.length === 0 ? (
                <div className="grid gap-1 pt-1">
                  <p className="px-1 pb-2 text-[11px] font-medium text-muted-foreground/72">
                    Suggested
                  </p>
                  {isFetchingSuggestions ? (
                    <div className="grid gap-1">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <TrackResultSkeleton key={index} />
                      ))}
                    </div>
                  ) : suggestedTracks.length > 0 ? (
                    suggestedTracks.map((result) => (
                      <TrackResultButton
                        key={`${result.provider}:${result.provider_id}`}
                        result={result}
                        onClick={() => {
                          if (isSearchIntent) {
                            openTrack(result);
                            return;
                          }

                          handleResultSelect(result);
                        }}
                      />
                    ))
                  ) : (
                    fallbackSuggestedSearches.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuery(suggestion)}
                        className="group flex min-h-12 w-full items-center gap-3 rounded-[0.82rem] border border-border/20 bg-foreground/[0.028] px-3 py-2.5 text-left text-[13px] transition-[background-color,border-color] duration-150 ease-[var(--kocteau-ease)] hover:border-border/32 hover:bg-foreground/[0.05]"
                      >
                        <Search className="size-3.5 shrink-0 text-muted-foreground/68 transition-colors group-hover:text-muted-foreground/88" />
                        <span className="min-w-0 flex-1 truncate">{suggestion}</span>
                        <ComposeChevronRightIcon className="size-4 shrink-0 text-muted-foreground/48 transition-colors group-hover:text-muted-foreground/78" />
                      </button>
                    ))
                  )}
                </div>
              ) : null}

              {!showSearchLoading && normalizedQuery.length > 0 && normalizedQuery.length < 2 ? (
                <div className="px-1 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Type at least 2 characters to start searching.
                  </p>
                </div>
              ) : null}

              {!showSearchLoading && normalizedQuery.length >= 2 && results.length === 0 ? (
                <div className="px-1 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No tracks found.</p>
                </div>
              ) : null}

              {results.length > 0 ? (
                results.map((result, index) => (
                  <TrackResultButton
                    key={`${result.provider}:${result.provider_id}`}
                    result={result}
                    active={activeResultIndex === index}
                    buttonRef={(node) => {
                      resultRefs.current[index] = node;
                    }}
                    onClick={() => {
                      if (isSearchIntent) {
                        openTrack(result);
                        return;
                      }

                      handleResultSelect(result);
                    }}
                  />
                ))
              ) : null}
            </div>
          </ScrollArea>
        </section>

        <section className="t-page flex min-h-0 flex-col px-4 py-4 md:px-5" data-page-id="2">
          <div className="mb-5 flex shrink-0 items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[0.95rem] border border-border/20 bg-foreground/[0.032] px-3 py-3">
              <EntityCoverImage
                src={selected?.cover_url}
                alt={selected?.title ?? "Selected track"}
                sizes="56px"
                quality={58}
                className="h-14 w-14 shrink-0 rounded-[0.68rem] bg-muted shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                iconClassName="size-5"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-5">{selected?.title}</p>
                <p className="truncate text-[13px] text-muted-foreground/82">
                  {selected?.artist_name ?? "Unknown artist"}
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/64">
                  <TrackDiscIcon className="size-3" />
                  Track
                </span>
              </div>

            </div>
          </div>

          {errorMsg ? (
            <Alert variant="destructive" className="mb-5 shrink-0">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-3">
              <section className="border-t border-border/18 pt-4 first:border-t-0 first:pt-0">
                <p className="mb-3 text-[12px] font-medium text-muted-foreground/82">Rating</p>
                <RatingStars
                  value={rating}
                  onChange={(nextRating) => {
                    setRating(nextRating);
                    setFieldErrors((current) => ({ ...current, rating: undefined }));
                  }}
                  disabled={saving}
                />
                <FieldError>{fieldErrors.rating}</FieldError>
              </section>

              <section className="border-t border-border/14 pt-3">
                <label className="sr-only" htmlFor="review-title">
                  Review title
                </label>
                <Input
                  id="review-title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setFieldErrors((current) => ({ ...current, review_title: undefined }));
                  }}
                  placeholder="Title"
                  disabled={saving}
                  className="h-10 rounded-none border-0 bg-transparent px-0 text-[16px] font-semibold shadow-none placeholder:text-muted-foreground/68 focus-visible:ring-0"
                  maxLength={120}
                  aria-invalid={Boolean(fieldErrors.review_title)}
                />
                <FieldError>{fieldErrors.review_title}</FieldError>
              </section>

              <section className="border-t border-border/10 pt-2">
                <label className="sr-only" htmlFor="review-body">
                  Review note
                </label>
                <Textarea
                  id="review-body"
                  value={body}
                  onChange={(event) => {
                    setBody(event.target.value);
                    setFieldErrors((current) => ({ ...current, review_body: undefined }));
                  }}
                  placeholder="Add a note…"
                  className="min-h-32 resize-none rounded-none border-0 bg-transparent px-0 text-[14px] leading-6 shadow-none placeholder:text-muted-foreground/62 focus-visible:ring-0"
                  disabled={saving}
                  maxLength={2000}
                  aria-invalid={Boolean(fieldErrors.review_body)}
                />
                <FieldError>{fieldErrors.review_body}</FieldError>
              </section>
            </div>
          </ScrollArea>
        </section>
      </div>

      {!isSearchIntent && step === "compose" ? (
        <div className="shrink-0 border-t border-border/20 bg-[var(--kocteau-surface)] px-4 py-3 md:px-5">
          <div className={cn("flex items-center gap-3", showCancelAction ? "justify-between" : "justify-end")}>
            {showCancelAction ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="min-w-22 rounded-[0.72rem] border-border/28 bg-transparent px-4 text-foreground shadow-none hover:bg-foreground/[0.055]"
              >
                Cancel
              </Button>
            ) : null}

            <Button
              type="button"
              onClick={handleContinue}
              disabled={!canPublish}
              className={cn(
                "min-w-24 rounded-[0.72rem] bg-foreground px-4 text-background shadow-none hover:bg-foreground/92 disabled:border-border/36 disabled:bg-card/32 disabled:text-muted-foreground",
                primaryActionFullWidth && "w-full",
              )}
            >
              {continueLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
