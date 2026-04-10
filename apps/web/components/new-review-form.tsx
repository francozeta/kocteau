"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Search } from "lucide-react";
import { FaDeezer } from "react-icons/fa";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EntityCoverImage from "@/components/entity-cover-image";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDeezerSearch } from "@/hooks/use-deezer-search";
import { toastActionSuccess } from "@/lib/feedback";
import { ApiError, createApiError, getFirstFieldError } from "@/lib/validation/errors";
import { createReviewSchema, updateReviewSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";
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

type PublishReviewResponse = {
  ok: boolean;
  reviewId?: string | null;
  entityId?: string | null;
  authorUsername?: string | null;
};

type NewReviewFormProps = {
  mode?: "create" | "edit";
  reviewId?: string | null;
  onSuccess?: () => void;
  initialQuery?: string;
  initialSelection?: DeezerResult | null;
  initialRating?: number | null;
  initialTitle?: string;
  initialBody?: string;
  initialPinned?: boolean;
  redirectToOnSuccess?: string | null;
};

type Step = "search" | "compose";

export default function NewReviewForm({
  mode = "create",
  reviewId = null,
  onSuccess,
  initialQuery = "",
  initialSelection = null,
  initialRating = null,
  initialTitle = "",
  initialBody = "",
  initialPinned = false,
  redirectToOnSuccess = null,
}: NewReviewFormProps) {
  const router = useRouter();
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isEditMode = mode === "edit" && Boolean(reviewId);

  const [step, setStep] = useState<Step>(initialSelection ? "compose" : "search");
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<DeezerResult | null>(initialSelection);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);

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
  const { data, isFetching, error: searchError } = useDeezerSearch({
    query,
    type: "track",
    enabled: searchEnabled,
  });
  const results = useMemo(() => (searchEnabled ? ((data ?? []) as DeezerResult[]) : []), [data, searchEnabled]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialSelection) {
      setSelected(initialSelection);
      setStep("compose");
      setErrorMsg(null);
      return;
    }

    setSelected(null);
    setStep("search");
  }, [initialSelection]);

  useEffect(() => {
    setRating(initialRating);
    setTitle(initialTitle);
    setBody(initialBody);
  }, [initialBody, initialRating, initialTitle, reviewId]);

  useEffect(() => {
    if (step !== "search" || normalizedQuery.length < 2 || results.length === 0) {
      setActiveResultIndex(-1);
      return;
    }

    setActiveResultIndex(0);
  }, [normalizedQuery, results.length, step]);

  useEffect(() => {
    if (activeResultIndex < 0) {
      return;
    }

    resultRefs.current[activeResultIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeResultIndex]);

  function resetAll() {
    setStep(initialSelection ? "compose" : "search");
    setSelected(initialSelection);
    setQuery(initialQuery);
    setRating(initialRating);
    setTitle(initialTitle);
    setBody(initialBody);
    setErrorMsg(null);
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
      handleResultSelect(results[activeResultIndex]);
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

      if (payload.entityId) {
        router.prefetch(`/track/${payload.entityId}`);
      }

      if (payload.authorUsername) {
        router.prefetch(`/u/${payload.authorUsername}`);
      }

      const shouldRedirectToCreatedTrack =
        !isEditMode &&
        Boolean(payload.entityId) &&
        selected?.entity_id !== payload.entityId;

      toastActionSuccess(isEditMode ? "Review updated." : "Review published.");
      router.refresh();
      if (redirectToOnSuccess) {
        router.push(redirectToOnSuccess);
      } else if (shouldRedirectToCreatedTrack && payload.entityId) {
        router.push(`/track/${payload.entityId}`);
      }
      onSuccess?.();
      resetAll();
    } catch (error) {
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
          router.prefetch(`/track/${existingEntityId}?editReview=${existingReviewId}`);
        }

        toast.error(reviewError.message, {
          action: {
            label: existingEntityId ? "Open track" : "Dismiss",
            onClick: () => {
              if (existingEntityId) {
                router.push(`/track/${existingEntityId}?editReview=${existingReviewId}`);
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
              : "Ocurrió un error al crear la reseña. Intenta nuevamente."),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-4">
      {step === "search" ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Search className="size-4" />
              Search
            </p>
            <Badge variant="secondary" className="shrink-0 text-xs">
              Tracks only
            </Badge>
          </div>

          {errorMsg ? (
            <Alert variant="destructive" className="mb-4 shrink-0">
              <AlertTitle>We could not continue</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          {searchError ? (
            <Alert variant="destructive" className="mb-4 shrink-0">
              <AlertTitle>We could not search</AlertTitle>
              <AlertDescription>{searchError.message}</AlertDescription>
            </Alert>
          ) : null}

          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setFieldErrors((current) => ({ ...current, selected: undefined }));
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Track name or artist..."
            disabled={saving}
            autoFocus
            className="mb-3 h-11 shrink-0 rounded-2xl border-border/34 bg-card/26 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/25 md:bg-background/60"
            maxLength={80}
          />
          <FieldError>{fieldErrors.selected}</FieldError>

          <ScrollArea className="min-h-0 flex-1 rounded-[1.35rem] border border-border/32 bg-card/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/12">
            <div className="space-y-0">
              {isFetching && results.length === 0 ? (
                <div className="space-y-3 px-4 py-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
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
                  Updating results...
                </div>
              ) : null}

              {!isFetching && !normalizedQuery ? (
                <>
                  <div className="border-b px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Suggested
                    </p>
                  </div>
                  <div className="divide-y">
                    {suggestedSearches.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuery(suggestion)}
                        className="w-full px-4 py-3 text-left text-sm transition hover:bg-muted/35"
                      >
                        {suggestion}
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
                <div className="divide-y">
                  {results.map((result, index) => (
                    <button
                      key={result.provider_id}
                      type="button"
                      ref={(node) => {
                        resultRefs.current[index] = node;
                      }}
                      onClick={() => handleResultSelect(result)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/35 data-[active=true]:bg-muted/40"
                      data-active={activeResultIndex === index}
                    >
                      <EntityCoverImage
                        src={result.cover_url}
                        alt={result.title}
                        sizes="40px"
                        quality={56}
                        className="h-10 w-10 shrink-0 rounded-xl bg-muted"
                        iconClassName="size-4"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{result.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {result.artist_name ?? "Unknown artist"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3 shrink-0">
            {!isEditMode ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goBackToSearch}
                className="shrink-0 rounded-full"
              >
                <ArrowLeft className="size-4" />
                <span className="sr-only">Back to search</span>
              </Button>
            ) : null}

            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.35rem] border border-border/32 bg-card/20 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/12">
              <EntityCoverImage
                src={selected?.cover_url}
                alt={selected?.title ?? "Selected track"}
                sizes="48px"
                quality={56}
                className="h-12 w-12 shrink-0 rounded-[1rem] bg-muted"
                iconClassName="size-5"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm">{selected?.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {selected?.artist_name ?? "Unknown artist"}
                </p>
              </div>

              {selected?.deezer_url ? (
                <Button asChild type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full">
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

          <ScrollArea className="mb-5 min-h-0 flex-1 rounded-[1.35rem] border border-border/32 bg-card/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/12">
            <div className="p-5">
              <div className="space-y-6">
                <section>
                  <p className="text-sm font-medium mb-3">Rating</p>
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
                    className="h-11 rounded-2xl border-border/34 bg-card/26 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/25 md:bg-background/60"
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
                    className="min-h-24 resize-none rounded-2xl border-border/34 bg-card/26 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/25 md:bg-background/60"
                    disabled={saving}
                    maxLength={2000}
                    aria-invalid={Boolean(fieldErrors.review_body)}
                  />
                  <FieldError>{fieldErrors.review_body}</FieldError>
                </section>
              </div>
            </div>
          </ScrollArea>

          <div className="flex shrink-0 gap-3">
            {!isEditMode ? (
              <Button type="button" variant="ghost" onClick={goBackToSearch} disabled={saving} className="flex-1 rounded-2xl">
                Back
              </Button>
            ) : null}

            <Button
              type="button"
              onClick={onSubmit}
              disabled={saving || !selected || rating === null}
              className={cn("rounded-2xl", !isEditMode && "flex-1", isEditMode && "w-full")}
            >
              {saving ? (isEditMode ? "Saving..." : "Publishing...") : isEditMode ? "Save changes" : "Publish"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
