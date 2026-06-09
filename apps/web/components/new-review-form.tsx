"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FaDeezer } from "react-icons/fa";
import { ArrowLeft, ChevronRight, Disc3, LoaderCircle, Search } from "@/components/ui/icons";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import EntityCoverImage from "@/components/entity-cover-image";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    selected?: string;
    rating?: string;
    review_title?: string;
    review_body?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  const suggestedSearches = ["Radiohead", "Björk", "Bad Bunny", "Frank Ocean", "Massive Attack", "The Cure"];
  const searchEnabled = step === "search";
  const normalizedQuery = query.trim();
  const { data, isFetching, error: searchError, refetch: retrySearch } = useDeezerSearch({
    query,
    type: "track",
    enabled: searchEnabled,
  });
  const results = useMemo(() => (searchEnabled ? ((data ?? []) as DeezerResult[]) : []), [data, searchEnabled]);
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

  function goBackToSearch() {
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
  const canContinue =
    step === "search"
      ? Boolean(highlightedResult)
      : Boolean(selected) && rating !== null && !saving;
  const continueLabel = saving
    ? (isEditMode ? "Saving..." : "Publishing...")
    : step === "search"
      ? "Next"
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
      {step === "search" ? (
        <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-5">
          <div className="relative mb-3 shrink-0">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/80" />
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
              className="h-10 shrink-0 rounded-[0.7rem] border-border/24 bg-[var(--kocteau-surface-control)] pl-10 text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-muted-foreground/72"
              maxLength={80}
            />
          </div>

          {errorMsg ? (
            <Alert variant="destructive" className="mb-4 shrink-0">
              <AlertTitle>We could not continue</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          {searchError ? (
            <Alert className="mb-4 shrink-0 border-border/28 bg-card/22 pr-24">
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
                className="absolute top-1/2 right-2 inline-flex h-7 -translate-y-1/2 items-center rounded-full border border-border/28 px-2.5 text-[11px] font-medium text-foreground/88 transition hover:bg-foreground/[0.055] disabled:pointer-events-none disabled:opacity-55"
              >
                {isFetching ? "Retrying" : "Retry"}
              </button>
            </Alert>
          ) : null}
          <FieldError>{fieldErrors.selected}</FieldError>

          <ScrollArea className="min-h-0 flex-1 rounded-[0.85rem] border border-border/24 bg-[var(--kocteau-surface-raised)] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
            <div className="space-y-0">
              {isFetching && results.length === 0 ? (
                <div className="space-y-3 px-4 py-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {isFetching && results.length > 0 ? (
                <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                  <LoaderCircle className="size-3.5 animate-spin" />
                  Updating results…
                </div>
              ) : null}

              {!isFetching && !normalizedQuery ? (
                <>
                  <div className="border-b border-border/18 px-4 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground/72">
                      Suggested
                    </p>
                  </div>
                  <div className="divide-y divide-border/16">
                    {suggestedSearches.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuery(suggestion)}
                        className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition hover:bg-foreground/[0.045]"
                      >
                        <Search className="size-3.5 shrink-0 text-muted-foreground/68" />
                        <span className="min-w-0 flex-1 truncate">{suggestion}</span>
                        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/54" />
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {!isFetching && normalizedQuery.length > 0 && normalizedQuery.length < 2 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Type at least 2 characters to start searching.
                  </p>
                </div>
              ) : null}

              {!isFetching && normalizedQuery.length >= 2 && results.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No tracks found.</p>
                </div>
              ) : null}

              {results.length > 0 ? (
                <div className="divide-y divide-border/16">
                  {results.map((result, index) => (
                    <button
                      key={result.provider_id}
                      type="button"
                      ref={(node) => {
                        resultRefs.current[index] = node;
                      }}
                      onClick={() => {
                        if (isSearchIntent) {
                          openTrack(result);
                          return;
                        }

                        handleResultSelect(result);
                      }}
                      className="group flex min-h-[4.5rem] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-foreground/[0.045] data-[active=true]:bg-foreground/[0.06]"
                      data-active={activeResultIndex === index}
                    >
                      <EntityCoverImage
                        src={result.cover_url}
                        alt={result.title}
                        sizes="40px"
                        quality={56}
                        className="h-10 w-10 shrink-0 rounded-[0.65rem] bg-muted shadow-[0_0_0_1px_rgba(255,255,255,0.055)]"
                        iconClassName="size-4"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">{result.title}</p>
                        <p className="truncate text-xs text-muted-foreground/82">
                          {result.artist_name ?? "Unknown artist"}
                        </p>
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground/64">
                          <Disc3 className="size-3" />
                          Track
                        </span>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/48 transition group-hover:text-muted-foreground/78" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-5">
          <div className="mb-5 flex items-center gap-3 shrink-0">
            {!isEditMode ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goBackToSearch}
                className="shrink-0 rounded-[0.7rem] text-muted-foreground hover:bg-foreground/[0.055] hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                <span className="sr-only">Back to search</span>
              </Button>
            ) : null}

            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[0.85rem] border border-border/24 bg-[var(--kocteau-surface-raised)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <EntityCoverImage
                src={selected?.cover_url}
                alt={selected?.title ?? "Selected track"}
                sizes="48px"
                quality={56}
                className="h-12 w-12 shrink-0 rounded-[0.7rem] bg-muted shadow-[0_0_0_1px_rgba(255,255,255,0.055)]"
                iconClassName="size-5"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{selected?.title}</p>
                <p className="truncate text-xs text-muted-foreground/82">
                  {selected?.artist_name ?? "Unknown artist"}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground/64">
                  <Disc3 className="size-3" />
                  Track
                </span>
              </div>

              {selected?.deezer_url ? (
                <Button asChild type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg">
                  <a href={selected.deezer_url} target="_blank" rel="noreferrer" title="Open on Deezer">
                    <FaDeezer className="size-4" />
                    <span className="sr-only">Open on Deezer</span>
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {errorMsg ? (
            <Alert variant="destructive" className="mb-5 shrink-0">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          <ScrollArea className="min-h-0 flex-1 rounded-[0.85rem] border border-border/24 bg-[var(--kocteau-surface-raised)] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
            <div className="p-4 md:p-5">
              <div className="space-y-5">
                <section>
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

                <section className="space-y-2">
                  <label className="text-xs font-medium  tracking-wide text-muted-foreground" htmlFor="review-title">
                    Title
                  </label>
                  <Input
                    id="review-title"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setFieldErrors((current) => ({ ...current, review_title: undefined }));
                    }}
                    placeholder="Give it a headline"
                    disabled={saving}
                    className="h-10 rounded-[0.7rem] border-border/24 bg-[var(--kocteau-surface-control)] text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-muted-foreground/72"
                    maxLength={120}
                    aria-invalid={Boolean(fieldErrors.review_title)}
                  />
                  <FieldError>{fieldErrors.review_title}</FieldError>
                </section>

                <section className="space-y-2">
                  <label className="text-xs font-medium  tracking-wide text-muted-foreground" htmlFor="review-body">
                    Note
                  </label>
                  <Textarea
                    id="review-body"
                    value={body}
                    onChange={(event) => {
                      setBody(event.target.value);
                      setFieldErrors((current) => ({ ...current, review_body: undefined }));
                    }}
                    placeholder="What did this track make you feel?"
                    className="min-h-28 resize-none rounded-[0.7rem] border-border/24 bg-[var(--kocteau-surface-control)] text-[13px] leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-muted-foreground/72"
                    disabled={saving}
                    maxLength={2000}
                    aria-invalid={Boolean(fieldErrors.review_body)}
                  />
                  <FieldError>{fieldErrors.review_body}</FieldError>
                </section>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {!isSearchIntent ? (
        <div className="shrink-0 border-t border-border/20 bg-[var(--kocteau-surface)] px-4 py-3 md:px-5">
          <div className={cn("flex items-center gap-3", showCancelAction ? "justify-between" : "justify-end")}>
            {showCancelAction ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="min-w-22 rounded-[0.7rem] border-border/28 bg-transparent px-4 text-foreground hover:bg-foreground/[0.055]"
              >
                Cancel
              </Button>
            ) : null}

            <Button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className={cn(
                "min-w-24 rounded-[0.7rem] bg-foreground px-4 text-background hover:bg-foreground/92 disabled:border-border/36 disabled:bg-card/32 disabled:text-muted-foreground",
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
