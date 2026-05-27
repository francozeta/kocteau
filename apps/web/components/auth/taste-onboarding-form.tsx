"use client";

import { startTransition, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "@/components/ui/icons";
import OnboardingStepFrame from "@/components/auth/onboarding-step-frame";
import NewReviewDialog from "@/components/new-review-dialog";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import { PrimaryGrowButton } from "@/components/ui/grow-button";
import {
  tasteOnboardingMaxTags,
  tasteOnboardingMinTags,
  type PreferenceTag,
} from "@/lib/taste";
import { cn } from "@/lib/utils";

type TasteOnboardingFormProps = {
  tags: PreferenceTag[];
  initialSelectedTagIds?: string[];
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
    description: "Review now, or skip and start with your feed.",
  },
] as const;

export function TasteOnboardingForm({
  tags,
  initialSelectedTagIds = [],
  nextPath = null,
}: TasteOnboardingFormProps) {
  const router = useRouter();
  const visibleTagIds = useMemo(() => new Set(tags.map((tag) => tag.id)), [tags]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState(
    () =>
      new Set(initialSelectedTagIds.filter((tagId) => visibleTagIds.has(tagId))),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [redirectTo, setRedirectTo] = useState(nextPath ?? "/?welcome=kocteau");
  const currentStep = tasteSteps[currentStepIndex];
  const selectedCount = selectedIds.size;
  const missingCount = Math.max(tasteOnboardingMinTags - selectedCount, 0);
  const submitLabel =
    currentStep.id === "review"
      ? "Skip for now"
      : isSaving
        ? "Saving"
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
      setError(`Choose ${missingCount} more to continue.`);
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

      setRedirectTo(nextPath ?? data.redirectTo ?? "/?welcome=kocteau");
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
      totalSteps={tasteSteps.length}
      title={currentStep.title}
      description={currentStep.description}
      error={error}
      onSubmit={handleSubmit}
      onBack={() => {
        setError(null);
        setCurrentStepIndex((index) => Math.max(index - 1, 0));
      }}
      submitLabel={submitLabel}
      submitDisabled={tags.length === 0}
      submitLoading={isSaving}
      submitIcon={currentStep.id === "signals" ? <ArrowRight className="size-4" /> : null}
      controlClassName={currentStep.id === "signals" ? "max-w-[30rem]" : undefined}
      liveMessage={`${currentStep.section}, step ${currentStepIndex + 1} of ${tasteSteps.length}.`}
    >
      {currentStep.id === "signals" ? (
        <TasteSignalCloud
          tags={tags}
          selectedIds={selectedIds}
          selectedCount={selectedCount}
          missingCount={missingCount}
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
  selectedCount,
  missingCount,
  onToggle,
}: {
  tags: PreferenceTag[];
  selectedIds: Set<string>;
  selectedCount: number;
  missingCount: number;
  onToggle: (tagId: string) => void;
}) {
  if (tags.length === 0) {
    return (
      <p className="max-w-[22rem] text-center text-sm leading-5 text-muted-foreground">
        Taste signals are not available yet.
      </p>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-end text-xs tabular-nums text-muted-foreground">
        {selectedCount} / {tasteOnboardingMaxTags}
        {missingCount > 0 ? ` - ${missingCount} left` : " - ready"}
      </div>
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {tags.map((tag) => {
          const isSelected = selectedIds.has(tag.id);

          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(tag.id)}
              className={cn(
                "min-h-9 rounded-full bg-[var(--kocteau-surface-control)] px-3 text-sm text-muted-foreground shadow-[var(--kocteau-shadow-control)] transition-[background-color,color,box-shadow,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:min-h-10 sm:px-3.5",
                isSelected &&
                  "bg-foreground text-background shadow-none hover:bg-foreground hover:text-background",
              )}
            >
              <span>{tag.label}</span>
              {isSelected ? <Check className="ml-1 inline size-3" /> : null}
            </button>
          );
        })}
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
        Optional. You can skip and review later.
      </p>
    </div>
  );
}
