"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "@/components/ui/icons";
import OnboardingStepFrame from "@/components/auth/onboarding-step-frame";
import NewReviewDialog from "@/components/new-review-dialog";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import { PrimaryGrowButton } from "@/components/ui/grow-button";
import {
  groupPreferenceTags,
  preferenceKindLabels,
  tasteOnboardingMaxTags,
  tasteOnboardingMinTags,
  type PreferenceTag,
} from "@/lib/taste";
import { cn } from "@/lib/utils";

type TasteOnboardingFormProps = {
  tags: PreferenceTag[];
  initialSelectedTagIds?: string[];
  mode?: "onboarding" | "edit";
  nextPath?: string | null;
};

type SaveTasteResponse = {
  error?: string;
  redirectTo?: string;
};

const tasteSteps = [
  {
    id: "signals",
    section: "Taste",
    title: "Choose your first signals.",
    description: "Pick at least three. Kocteau can tune the rest later.",
  },
  {
    id: "review",
    section: "Review",
    title: "Start with a track to review.",
    description: "Review now, or start using Kocteau.",
  },
] as const;

const tasteEditStep = {
  id: "signals",
  section: "Taste",
  title: "Tune your taste.",
  description: undefined,
} as const;

const onboardingFocusVisibleClass =
  "focus-visible:border-white/42 focus-visible:ring-0 focus-visible:shadow-none";

export function TasteOnboardingForm({
  tags,
  initialSelectedTagIds = [],
  mode = "onboarding",
  nextPath = null,
}: TasteOnboardingFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  const visibleTagIds = useMemo(() => new Set(tags.map((tag) => tag.id)), [tags]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState(
    () =>
      new Set(initialSelectedTagIds.filter((tagId) => visibleTagIds.has(tagId))),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [redirectTo, setRedirectTo] = useState(
    nextPath ?? (isEditMode ? "/search" : "/?welcome=kocteau"),
  );
  const currentStep = isEditMode ? tasteEditStep : tasteSteps[currentStepIndex];
  const totalSteps = isEditMode ? 1 : tasteSteps.length;
  const selectedCount = selectedIds.size;
  const submitLabel =
    currentStep.id === "review"
      ? "Start using app"
      : isSaving
        ? "Saving"
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

  function finishOnboarding() {
    startTransition(() => {
      router.replace(redirectTo);
      router.refresh();
    });
  }

  async function saveTasteProfile() {
    setError(null);

    if (selectedCount < tasteOnboardingMinTags) {
      setError("Choose at least three signals.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/preferences/taste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagIds: Array.from(selectedIds) }),
      });
      const data = (await response.json().catch(() => ({}))) as SaveTasteResponse;

      if (!response.ok) {
        throw new Error(data.error || "We could not save your taste profile.");
      }

      const nextRedirect =
        nextPath ?? data.redirectTo ?? (isEditMode ? "/search" : "/?welcome=kocteau");

      if (isEditMode) {
        startTransition(() => {
          router.replace(nextRedirect);
          router.refresh();
        });
        return;
      }

      setRedirectTo(nextRedirect);
      setCurrentStepIndex(1);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not save your taste profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentStep.id === "review") {
      finishOnboarding();
      return;
    }

    void saveTasteProfile();
  }

  return (
    <OnboardingStepFrame
      section={currentStep.section}
      currentStep={currentStepIndex + 1}
      totalSteps={totalSteps}
      title={currentStep.title}
      description={currentStep.description}
      error={error}
      onSubmit={handleSubmit}
      onBack={() => {
        setError(null);
        if (isEditMode) {
          router.replace(redirectTo);
          return;
        }

        setCurrentStepIndex((index) => Math.max(index - 1, 0));
      }}
      submitLabel={submitLabel}
      submitDisabled={tags.length === 0}
      submitLoading={isSaving}
      submitIcon={currentStep.id === "signals" ? <ArrowRight className="size-4" /> : null}
      compact={isEditMode}
      controlClassName={
        currentStep.id === "signals"
          ? "max-w-[28rem] py-0"
          : undefined
      }
      liveMessage={`${currentStep.section}, step ${currentStepIndex + 1} of ${totalSteps}.`}
    >
      {currentStep.id === "signals" ? (
        <TasteSignalCloud
          tags={tags}
          selectedIds={selectedIds}
          onToggle={toggleTag}
        />
      ) : (
        <ReviewStarterControl redirectTo={redirectTo} />
      )}
    </OnboardingStepFrame>
  );
}

function TasteSignalCloud({
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

  if (tags.length === 0) {
    return (
      <p className="max-w-[22rem] text-center text-sm leading-5 text-muted-foreground">
        Taste signals are not available yet.
      </p>
    );
  }

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
                  {kindTags.map((tag) => {
                    const isSelected = selectedIds.has(tag.id);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onToggle(tag.id)}
                        className={cn(
                          "min-h-7 rounded-full border border-transparent bg-[var(--kocteau-surface-control)] px-2.5 text-[12px] font-normal leading-none text-muted-foreground shadow-[var(--kocteau-shadow-control)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] hover:text-foreground active:scale-[0.96] focus-visible:outline-none",
                          onboardingFocusVisibleClass,
                          isSelected &&
                            "bg-foreground text-background shadow-none hover:bg-foreground hover:text-background",
                        )}
                      >
                        <span>{tag.label}</span>
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

function ReviewStarterControl({ redirectTo }: { redirectTo: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[21rem] flex-col items-center gap-3">
      <NewReviewDialog
        isAuthenticated
        redirectToOnSuccess={redirectTo}
        trigger={
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
        }
      />
      <p className="text-center text-xs leading-4 text-muted-foreground">
        Create a review now, or continue into your feed.
      </p>
    </div>
  );
}
