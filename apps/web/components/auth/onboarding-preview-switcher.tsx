"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { PrimaryGrowButton } from "@/components/ui/grow-button";
import { OnboardingFlowPreview } from "@/components/auth/onboarding-flow-preview";
import { OnboardingProgressBar } from "@/components/auth/onboarding-progress-bar";
import BrandLogo from "@/components/brand-logo";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import {
  groupPreferenceTags,
  preferenceKindLabels,
  tasteOnboardingMaxTags,
  tasteOnboardingMinTags,
  type PreferenceTag,
} from "@/lib/taste";
import { cn } from "@/lib/utils";

type PreviewMode = "profile" | "taste" | "edit";

const previewModes = [
  { id: "profile", label: "Profile" },
  { id: "taste", label: "Taste" },
  { id: "edit", label: "Edit" },
] as const satisfies Array<{ id: PreviewMode; label: string }>;

const createdAt = "2026-06-01T00:00:00.000Z";

const previewTags = [
  tag("genre", "alternative", "Alternative", 10),
  tag("genre", "indie-rock", "Indie Rock", 20),
  tag("genre", "electronic", "Electronic", 30),
  tag("genre", "post-punk", "Post-punk", 40),
  tag("mood", "melancholic", "Melancholic", 50),
  tag("mood", "nocturnal", "Nocturnal", 60),
  tag("mood", "euphoric", "Euphoric", 70),
  tag("mood", "intimate", "Intimate", 80),
  tag("scene", "bedroom", "Bedroom", 90),
  tag("scene", "club", "Club", 100),
  tag("scene", "underground", "Underground", 110),
  tag("style", "dream-pop", "Dream pop", 120),
  tag("style", "shoegaze", "Shoegaze", 130),
  tag("style", "guitar-driven", "Guitar-driven", 140),
  tag("style", "synth-heavy", "Synth-heavy", 150),
  tag("era", "current", "Current", 160),
  tag("era", "90s", "90s", 170),
  tag("era", "00s", "00s", 180),
  tag("era", "80s", "80s", 190),
  tag("format", "album-focused", "Album-focused", 200),
  tag("format", "deep-cuts", "Deep cuts", 210),
  tag("format", "live-session", "Live session", 220),
] satisfies PreferenceTag[];

const previewSelectedTagIds = previewTags
  .filter((tagItem) =>
    [
      "electronic",
      "melancholic",
      "nocturnal",
      "euphoric",
      "bedroom",
      "dream-pop",
      "shoegaze",
      "deep-cuts",
    ].includes(tagItem.slug),
  )
  .map((tagItem) => tagItem.id);

const previewFocusVisibleClass =
  "focus-visible:border-white/42 focus-visible:ring-0 focus-visible:shadow-none";

export function OnboardingPreviewSwitcher() {
  const [mode, setMode] = useState<PreviewMode>("taste");

  return (
    <>
      <div className="fixed right-3 top-3 z-50 flex h-8 rounded-full border border-border/60 bg-background/88 p-0.5 shadow-[var(--kocteau-shadow-control)] backdrop-blur">
        {previewModes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={cn(
              "min-w-[3.25rem] rounded-full border border-transparent px-2.5 text-[11px] font-medium text-muted-foreground transition-[background-color,border-color,color,transform] duration-150 ease-out hover:text-foreground active:scale-[0.96] focus-visible:outline-none",
              previewFocusVisibleClass,
              mode === item.id &&
                "bg-foreground text-background hover:text-background",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "profile" ? (
        <OnboardingFlowPreview />
      ) : (
        <TastePreviewFlow key={mode} mode={mode} />
      )}
    </>
  );
}

function TastePreviewFlow({ mode }: { mode: "taste" | "edit" }) {
  const isEditMode = mode === "edit";
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(isEditMode ? previewSelectedTagIds : []),
  );
  const [error, setError] = useState<string | null>(null);
  const currentStepId = isEditMode || currentStepIndex === 0 ? "signals" : "review";
  const totalSteps = isEditMode ? 1 : 2;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const canGoBack = !isEditMode && currentStepIndex > 0;
  const submitLabel =
    currentStepId === "review"
      ? "Start using app"
      : isEditMode
        ? "Save taste"
        : "Continue";

  function toggleTag(tagId: string) {
    setError(null);
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(tagId)) {
        next.delete(tagId);
        return next;
      }

      if (next.size >= tasteOnboardingMaxTags) {
        setError(`Choose ${tasteOnboardingMaxTags} signals or fewer.`);
        return current;
      }

      next.add(tagId);
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (currentStepId === "review") {
      return;
    }

    if (selectedIds.size < tasteOnboardingMinTags) {
      setError("Choose at least three signals.");
      return;
    }

    if (!isEditMode) {
      setCurrentStepIndex(1);
    }
  }

  return (
    <main className="relative isolate flex h-svh overflow-hidden flex-col bg-background text-foreground">
      <OnboardingProgressBar value={progress} />

      <header className="relative z-10 mx-auto flex w-full max-w-[31rem] shrink-0 flex-col px-5 pt-5 sm:px-8 sm:pt-6">
        <div className="flex justify-center">
          <div className="inline-flex h-8 w-8 items-center justify-center text-foreground">
            <BrandLogo priority iconClassName="h-[1.35rem] w-[1.35rem]" />
          </div>
        </div>
      </header>

      <form
        id="taste-preview-form"
        onSubmit={handleSubmit}
        className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]"
      >
        <section className="flex min-h-0 items-center justify-center px-5 py-2 sm:px-8 sm:py-3">
          <div className="flex h-full min-h-0 w-full max-w-[32rem] flex-col justify-center gap-3">
            <div className="mx-auto max-w-[24rem] space-y-1.5 text-center">
              <h1 className="text-balance font-heading text-[1.55rem] font-medium leading-tight tracking-tight text-foreground sm:text-[1.65rem]">
                {currentStepId === "review"
                  ? "Start with a track to review."
                  : isEditMode
                    ? "Tune your taste."
                    : "Choose your first signals."}
              </h1>
              {currentStepId === "signals" && !isEditMode ? (
                <p className="text-pretty text-sm leading-5 text-muted-foreground">
                  Pick a few signals Kocteau can use to shape discovery.
                </p>
              ) : null}
            </div>

            <div className="mx-auto flex min-h-0 w-full max-w-[28rem] items-center justify-center px-1 py-1">
              {currentStepId === "signals" ? (
                <PreviewTasteSignalCloud
                  tags={previewTags}
                  selectedIds={selectedIds}
                  onToggle={toggleTag}
                />
              ) : (
                <PreviewReviewStarter />
              )}
            </div>

            <div className="min-h-5 text-center text-xs text-destructive">
              {error}
            </div>
          </div>
        </section>

        <footer className="mx-auto flex h-[4.75rem] w-full max-w-[32rem] shrink-0 items-center justify-between gap-4 pb-5 pl-5 pr-[5.5rem] sm:h-[4.5rem] sm:px-8 sm:pb-5">
          {canGoBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={() => {
                setError(null);
                setCurrentStepIndex((index) => Math.max(index - 1, 0));
              }}
              aria-label="Go back"
              className="size-10 rounded-full bg-foreground/[0.04] text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out hover:bg-foreground/[0.08] hover:text-foreground active:scale-[0.96]"
            >
              <ArrowLeft className="size-4" />
            </Button>
          ) : (
            <div className="size-10" aria-hidden="true" />
          )}

          <div className="min-w-0 flex-1" aria-hidden="true" />

          <Button
            type="submit"
            size="lg"
            className="h-10 min-w-[8.75rem] rounded-full px-5 text-sm transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]"
          >
            {submitLabel}
            {currentStepId === "signals" ? <ArrowRight className="size-4" /> : null}
          </Button>
        </footer>
      </form>

      <span className="sr-only" aria-live="polite">
        {currentStepId === "review"
          ? "Review step preview."
          : isEditMode
            ? "Taste edit preview."
            : "Taste onboarding preview."}
      </span>
    </main>
  );
}

function PreviewTasteSignalCloud({
  tags,
  selectedIds,
  onToggle,
}: {
  tags: PreferenceTag[];
  selectedIds: Set<string>;
  onToggle: (tagId: string) => void;
}) {
  const groupedTags = useMemo(() => groupPreferenceTags(tags), [tags]);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [scrollEdges, setScrollEdges] = useState({
    hasBottomOverflow: false,
    hasTopOverflow: false,
  });

  function updateScrollEdges() {
    const element = scrollAreaRef.current;

    if (!element) {
      return;
    }

    setScrollEdges({
      hasBottomOverflow:
        element.scrollTop + element.clientHeight < element.scrollHeight - 4,
      hasTopOverflow: element.scrollTop > 4,
    });
  }

  useEffect(() => {
    updateScrollEdges();
  }, [tags.length]);

  return (
    <div className="relative w-full max-w-[31rem]">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-background via-background/72 to-transparent opacity-0 transition-opacity duration-150 ease-out",
          scrollEdges.hasTopOverflow && "opacity-100",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-background via-background/78 to-transparent opacity-0 transition-opacity duration-150 ease-out",
          scrollEdges.hasBottomOverflow && "opacity-100",
        )}
      />
      <div
        ref={scrollAreaRef}
        onScroll={updateScrollEdges}
        className="max-h-[min(19rem,52dvh)] overflow-y-auto overscroll-contain px-1.5 py-5 pr-2 [scrollbar-color:var(--scrollbar-thumb)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--scrollbar-thumb)] [&::-webkit-scrollbar-thumb:hover]:bg-[var(--scrollbar-thumb-hover)]"
      >
        <div className="space-y-2.5">
          {Array.from(groupedTags.entries()).map(([kind, kindTags]) => {
            if (kindTags.length === 0) {
              return null;
            }

            return (
              <section key={kind} className="space-y-1.5">
                <h2 className="text-center text-[10px] font-medium leading-none text-muted-foreground/55">
                  {preferenceKindLabels[kind].toLowerCase()}
                </h2>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {kindTags.map((tagItem) => {
                    const isSelected = selectedIds.has(tagItem.id);

                    return (
                      <button
                        key={tagItem.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onToggle(tagItem.id)}
                        className={cn(
                          "min-h-7 rounded-full border border-transparent bg-[var(--kocteau-surface-control)] px-2.5 text-[12px] font-normal leading-none text-muted-foreground shadow-[var(--kocteau-shadow-control)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] hover:text-foreground active:scale-[0.96] focus-visible:outline-none",
                          previewFocusVisibleClass,
                          isSelected &&
                            "bg-foreground text-background shadow-none hover:bg-foreground hover:text-background",
                        )}
                      >
                        <span>{tagItem.label}</span>
                        {isSelected ? (
                          <Check className="ml-1 inline size-2.5 align-[-0.08em]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PreviewReviewStarter() {
  return (
    <div className="mx-auto flex w-full max-w-[21rem] flex-col items-center gap-3">
      <PrimaryGrowButton
        type="button"
        size="icon-lg"
        aria-label="Start a track review"
        className="relative isolate size-14 overflow-hidden rounded-[1rem] p-0 text-background"
      >
        <span
          aria-hidden="true"
          className="kocteau-review-glow pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] opacity-70 blur-[1px]"
        />
        <ReviewGlyphIcon className="relative size-[1.1rem]" />
      </PrimaryGrowButton>
      <p className="text-center text-xs leading-4 text-muted-foreground">
        Create a review now, or continue into your feed.
      </p>
    </div>
  );
}

function tag(
  kind: PreferenceTag["kind"],
  slug: string,
  label: string,
  sortOrder: number,
): PreferenceTag {
  return {
    created_at: createdAt,
    description: null,
    id: `preview-${slug}`,
    is_featured: true,
    kind,
    label,
    slug,
    sort_order: sortOrder,
  };
}
