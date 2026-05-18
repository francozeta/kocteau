"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Disc3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PrimaryGrowButton } from "@/components/ui/grow-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingWelcomeDialog } from "@/components/auth/onboarding-welcome-dialog";
import BrandLogo from "@/components/brand-logo";
import NewReviewDialog from "@/components/new-review-dialog";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import {
  avatarPresets,
  createAvatarPresetDataUrl,
  type AvatarPresetId,
} from "@/lib/avatar-presets";
import { cn } from "@/lib/utils";

type PreviewDraft = {
  displayName: string;
  username: string;
  avatarPresetId: AvatarPresetId | null;
  uploadedAvatarUrl: string | null;
  bio: string;
  signals: string[];
  scenes: string[];
  starterTrack: string | null;
};

type PreviewStep = {
  id:
    | "name"
    | "handle"
    | "avatar"
    | "bio"
    | "signals"
    | "rooms"
    | "track"
    | "finish";
  section: "Profile" | "Taste" | "Review";
  question: string;
  helper?: string;
};

const steps = [
  {
    id: "name",
    section: "Profile",
    question: "What should listeners call you?",
    helper: "Use the name you want attached to reviews.",
  },
  {
    id: "handle",
    section: "Profile",
    question: "Choose your Kocteau handle.",
    helper: "Short, searchable, and easy to mention.",
  },
  {
    id: "avatar",
    section: "Profile",
    question: "Choose a profile image.",
    helper: "Use a photo or a Kocteau disc.",
  },
  {
    id: "bio",
    section: "Profile",
    question: "Write a short taste note.",
    helper: "Optional. Add one line now, or leave it for later.",
  },
  {
    id: "signals",
    section: "Taste",
    question: "Choose your first signals.",
    helper: "Pick at least three. Kocteau can tune the rest later.",
  },
  {
    id: "rooms",
    section: "Taste",
    question: "Where does your taste usually live?",
    helper: "Choose two or more listening rooms.",
  },
  {
    id: "track",
    section: "Review",
    question: "Start with a track to review.",
    helper: "Review now, or skip and start with your feed.",
  },
  {
    id: "finish",
    section: "Review",
    question: "Your For You feed starts here.",
    helper: "A final check before this becomes the real onboarding flow.",
  },
] as const satisfies PreviewStep[];

const tasteSignals = [
  "dream pop",
  "post-punk",
  "ambient",
  "shoegaze",
  "synth pop",
  "art rock",
  "left-field pop",
  "noise textures",
  "quiet vocals",
  "warm electronics",
];

const listeningRooms = [
  "late-night headphones",
  "small rooms",
  "rainy walks",
  "record store finds",
  "internet radio",
  "film scenes",
  "club exits",
  "Sunday mornings",
];

const starterTracks = [
  {
    id: "cherry-coloured-funk",
    title: "Cherry-coloured Funk",
    artist: "Cocteau Twins",
  },
  {
    id: "alison",
    title: "Alison",
    artist: "Slowdive",
  },
  {
    id: "plainsong",
    title: "Plainsong",
    artist: "The Cure",
  },
  {
    id: "sugar-for-the-pill",
    title: "Sugar for the Pill",
    artist: "Slowdive",
  },
];

const initialDraft: PreviewDraft = {
  displayName: "",
  username: "",
  avatarPresetId: "silver-haze",
  uploadedAvatarUrl: null,
  bio: "",
  signals: [],
  scenes: [],
  starterTrack: null,
};

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

function toggleLimitedValue(values: string[], value: string, maxCount: number) {
  if (values.includes(value)) {
    return values.filter((item) => item !== value);
  }

  if (values.length >= maxCount) {
    return values;
  }

  return [...values, value];
}

export function OnboardingFlowPreview() {
  const prefersReducedMotion = useReducedMotion();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [draft, setDraft] = useState<PreviewDraft>(initialDraft);
  const [attemptedStepId, setAttemptedStepId] = useState<PreviewStep["id"] | null>(null);
  const [previewComplete, setPreviewComplete] = useState(false);

  const currentStep = steps[currentStepIndex];
  const currentStepHelper = "helper" in currentStep ? currentStep.helper : undefined;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const selectedTrack = useMemo(
    () => starterTracks.find((track) => track.id === draft.starterTrack) ?? null,
    [draft.starterTrack],
  );

  const stepError = getStepError(currentStep.id, draft);
  const showStepError = attemptedStepId === currentStep.id && Boolean(stepError);
  const isLastStep = currentStepIndex === steps.length - 1;

  function updateDraft(nextDraft: Partial<PreviewDraft>) {
    setDraft((current) => ({ ...current, ...nextDraft }));
    setAttemptedStepId(null);
    setPreviewComplete(false);
  }

  useEffect(() => {
    return () => {
      if (draft.uploadedAvatarUrl) {
        URL.revokeObjectURL(draft.uploadedAvatarUrl);
      }
    };
  }, [draft.uploadedAvatarUrl]);

  function goBack() {
    setAttemptedStepId(null);
    setPreviewComplete(false);
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }

  function goNext(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (stepError) {
      setAttemptedStepId(currentStep.id);
      return;
    }

    setAttemptedStepId(null);

    if (isLastStep) {
      setPreviewComplete(true);
      return;
    }

    setCurrentStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  return (
    <main className="flex h-svh overflow-hidden flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-[32rem] shrink-0 flex-col gap-3 px-5 pt-4 sm:px-8 sm:pt-6">
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex h-8 w-8 items-center justify-center text-foreground transition-[opacity,transform] duration-150 ease-out hover:opacity-80 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Go to Kocteau home"
          >
            <BrandLogo priority iconClassName="h-[1.35rem] w-[1.35rem]" />
          </Link>
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-4 text-sm">
            <span className="font-medium text-foreground">{currentStep.section}</span>
            <span className="tabular-nums text-muted-foreground">
              {currentStepIndex + 1} / {steps.length}
            </span>
          </div>
          <div className="h-px overflow-hidden bg-border/45" aria-hidden="true">
            <div
              className="h-full bg-foreground transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <form
        id="onboarding-preview-form"
        onSubmit={goNext}
        className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]"
      >
        <section className="flex min-h-0 items-center justify-center px-5 py-3 sm:px-8 sm:py-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex h-full max-h-[32rem] min-h-[25rem] w-full max-w-[32rem] flex-col justify-center gap-3"
            >
              <div className="mx-auto max-w-[24rem] space-y-1.5 text-center">
                <h1 className="text-balance font-heading text-[1.55rem] font-bold leading-tight tracking-tight text-foreground sm:text-[1.65rem]">
                  {currentStep.question}
                </h1>
                {currentStepHelper ? (
                  <p className="text-pretty text-sm leading-5 text-muted-foreground">
                    {currentStepHelper}
                  </p>
                ) : null}
              </div>

              <div className="mx-auto flex min-h-0 w-full max-w-[28rem] items-center justify-center px-1 py-1">
                {renderStepControl(currentStep.id, draft, updateDraft)}
              </div>

              <div className="min-h-5 text-center text-xs text-destructive">
                {showStepError ? stepError : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="mx-auto flex h-28 w-full max-w-[32rem] shrink-0 items-center justify-between gap-4 px-5 pb-14 sm:h-20 sm:px-8 sm:pb-7">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={goBack}
            disabled={currentStepIndex === 0}
            aria-label="Go back"
            className="size-10 rounded-full bg-foreground/[0.04] text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out hover:bg-foreground/[0.08] hover:text-foreground active:scale-[0.96]"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="min-w-0 flex-1" aria-hidden="true" />

          <Button
            type="submit"
            size="lg"
            className="h-10 min-w-[8.75rem] rounded-full px-5 text-sm transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]"
          >
            {isLastStep ? "Finish preview" : currentStep.id === "track" ? "Skip for now" : "Continue"}
            {!isLastStep && currentStep.id !== "track" ? <ArrowRight className="size-4" /> : null}
          </Button>
        </footer>
      </form>

      <span className="sr-only" aria-live="polite">
        {previewComplete
          ? `Preview complete for ${draft.displayName || "this listener"}${
              selectedTrack ? ` reviewing ${selectedTrack.title}` : ""
            }.`
          : `${currentStep.section}, step ${currentStepIndex + 1} of ${steps.length}.`}
      </span>

      <OnboardingWelcomeDialog
        open={previewComplete}
        onOpenChange={setPreviewComplete}
      />
    </main>
  );
}

function getStepError(stepId: PreviewStep["id"], draft: PreviewDraft) {
  if (stepId === "name" && draft.displayName.trim().length < 2) {
    return "Add a display name to continue.";
  }

  if (stepId === "handle" && draft.username.trim().length < 3) {
    return "Choose a handle with at least three characters.";
  }

  if (stepId === "signals" && draft.signals.length < 3) {
    return "Choose at least three taste signals.";
  }

  if (stepId === "rooms" && draft.scenes.length < 2) {
    return "Choose at least two listening rooms.";
  }

  return null;
}

function renderStepControl(
  stepId: PreviewStep["id"],
  draft: PreviewDraft,
  updateDraft: (draft: Partial<PreviewDraft>) => void,
) {
  if (stepId === "name") {
    return (
      <Input
        autoFocus
        value={draft.displayName}
        onChange={(event) => updateDraft({ displayName: event.target.value })}
        placeholder="Fran Cocteau"
        className="h-11 w-full rounded-[var(--kocteau-radius-control)] border-0 bg-[var(--kocteau-surface-control)] px-4 text-base shadow-[var(--kocteau-shadow-control)] placeholder:text-muted-foreground/55 focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    );
  }

  if (stepId === "handle") {
    return (
      <div className="flex h-11 w-full items-center rounded-[var(--kocteau-radius-control)] bg-[var(--kocteau-surface-control)] px-4 shadow-[var(--kocteau-shadow-control)] focus-within:ring-2 focus-within:ring-ring/30">
        <span className="select-none text-base text-muted-foreground">@</span>
        <input
          autoFocus
          value={draft.username}
          onChange={(event) => updateDraft({ username: normalizeUsername(event.target.value) })}
          placeholder="fran_cocteau"
          className="h-full min-w-0 flex-1 bg-transparent px-1 text-base text-foreground outline-none placeholder:text-muted-foreground/55"
        />
      </div>
    );
  }

  if (stepId === "avatar") {
    return <AvatarStepControl draft={draft} updateDraft={updateDraft} />;
  }

  if (stepId === "bio") {
    return (
      <Textarea
        autoFocus
        value={draft.bio}
        onChange={(event) => updateDraft({ bio: event.target.value.slice(0, 180) })}
        placeholder="Dream pop, noisy guitars, late-night pop records."
        className="min-h-28 w-full resize-none rounded-[var(--kocteau-radius-control)] border-0 bg-[var(--kocteau-surface-control)] p-4 text-base leading-6 shadow-[var(--kocteau-shadow-control)] placeholder:text-muted-foreground/55 focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    );
  }

  if (stepId === "signals") {
    return (
      <ChoiceCloud
        values={tasteSignals}
        selectedValues={draft.signals}
        onToggle={(value) =>
          updateDraft({ signals: toggleLimitedValue(draft.signals, value, 5) })
        }
        counter={`${draft.signals.length} / 5`}
      />
    );
  }

  if (stepId === "rooms") {
    return (
      <ChoiceCloud
        values={listeningRooms}
        selectedValues={draft.scenes}
        onToggle={(value) =>
          updateDraft({ scenes: toggleLimitedValue(draft.scenes, value, 4) })
        }
        counter={`${draft.scenes.length} / 4`}
      />
    );
  }

  if (stepId === "track") {
    return (
      <div className="mx-auto flex w-full max-w-[21rem] flex-col items-center gap-3">
        <NewReviewDialog
          isAuthenticated
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
          onSuccess={() => updateDraft({ starterTrack: starterTracks[0].id })}
        />
        <p className="text-center text-xs leading-4 text-muted-foreground">
          Optional. You can skip and review later.
        </p>
      </div>
    );
  }

  return <PreviewSummary draft={draft} />;
}

function AvatarStepControl({
  draft,
  updateDraft,
}: {
  draft: PreviewDraft;
  updateDraft: (draft: Partial<PreviewDraft>) => void;
}) {
  const [isDiscPickerOpen, setIsDiscPickerOpen] = useState(false);
  const avatarPreviewUrl =
    draft.uploadedAvatarUrl ??
    createAvatarPresetDataUrl(draft.avatarPresetId ?? "silver-haze", 180);

  function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setIsDiscPickerOpen(false);
    updateDraft({
      avatarPresetId: null,
      uploadedAvatarUrl: URL.createObjectURL(file),
    });
    event.currentTarget.value = "";
  }

  return (
    <div className="relative mx-auto flex w-full max-w-[20rem] justify-center">
      <div className="relative">
        <label
          aria-label="Upload profile image"
          className="group relative flex size-28 cursor-pointer items-center justify-center rounded-full bg-[var(--kocteau-surface-control)] p-1.5 shadow-[var(--kocteau-shadow-control),0_14px_42px_rgba(0,0,0,0.22)] transition-[box-shadow,transform,background-color] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] hover:shadow-[var(--kocteau-shadow-card-hover),0_18px_52px_rgba(0,0,0,0.28)] active:scale-[0.96] focus-within:ring-2 focus-within:ring-ring/35"
        >
          <span className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-background outline outline-1 outline-white/10">
            <Image
              src={avatarPreviewUrl}
              alt=""
              width={112}
              height={112}
              unoptimized
              className="size-full rounded-full object-cover"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-black/0 transition-colors duration-150 ease-out group-hover:bg-black/12"
            />
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarFileChange}
          />
        </label>

        <button
          type="button"
          aria-label="Choose a Kocteau disc"
          aria-expanded={isDiscPickerOpen}
          onClick={() => setIsDiscPickerOpen((open) => !open)}
          className={cn(
            "absolute -right-1 bottom-1 flex size-9 items-center justify-center rounded-full bg-background text-foreground shadow-[0_0_0_3px_var(--background),var(--kocteau-shadow-card-hover)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            isDiscPickerOpen && "bg-foreground text-background",
          )}
        >
          <Disc3
            className={cn(
              "size-4 transition-transform duration-150 ease-out",
              isDiscPickerOpen ? "rotate-45 scale-[0.96]" : "rotate-0 scale-100",
            )}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isDiscPickerOpen ? (
          <motion.div
            key="disc-picker"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute left-1/2 top-[calc(100%+0.75rem)] z-10 w-[17rem] -translate-x-1/2 rounded-[1.05rem] bg-[var(--kocteau-surface)] p-2 shadow-[var(--kocteau-shadow-card-hover)]"
          >
            <div className="grid grid-cols-3 gap-2">
              {avatarPresets.map((preset) => {
                const isSelected = draft.avatarPresetId === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      updateDraft({
                        avatarPresetId: preset.id,
                        uploadedAvatarUrl: null,
                      });
                      setIsDiscPickerOpen(false);
                    }}
                    className={cn(
                      "group relative flex aspect-square min-h-[4rem] items-center justify-center rounded-[0.85rem] bg-[var(--kocteau-surface-control)] shadow-[var(--kocteau-shadow-control)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                      isSelected &&
                        "bg-[var(--kocteau-surface-featured)] shadow-[var(--kocteau-shadow-card-hover)]",
                    )}
                  >
                    <Image
                      src={createAvatarPresetDataUrl(preset.id, 160)}
                      alt={preset.label}
                      width={52}
                      height={52}
                      unoptimized
                      className="size-12 rounded-full object-cover outline outline-1 outline-white/10"
                    />
                    {isSelected ? (
                      <span className="absolute right-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                        <Check className="size-3" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ChoiceCloud({
  values,
  selectedValues,
  onToggle,
  counter,
}: {
  values: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  counter: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end text-xs tabular-nums text-muted-foreground">
        {counter}
      </div>
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {values.map((value) => {
          const isSelected = selectedValues.includes(value);

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(value)}
              className={cn(
                "min-h-9 rounded-full bg-[var(--kocteau-surface-control)] px-3 text-sm text-muted-foreground shadow-[var(--kocteau-shadow-control)] transition-[background-color,color,box-shadow,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:min-h-10 sm:px-3.5",
                isSelected && "bg-foreground text-background shadow-none hover:bg-foreground hover:text-background",
              )}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewSummary({ draft }: { draft: PreviewDraft }) {
  const selectedTrack =
    starterTracks.find((track) => track.id === draft.starterTrack) ?? null;

  return (
    <div className="space-y-4 rounded-[1.15rem] bg-[var(--kocteau-surface-control)] p-4 shadow-[var(--kocteau-shadow-control)]">
      <div className="flex items-center gap-3">
        <Image
          src={
            draft.uploadedAvatarUrl ??
            createAvatarPresetDataUrl(draft.avatarPresetId ?? "silver-haze", 180)
          }
          alt="Selected profile image"
          width={64}
          height={64}
          unoptimized
          className="size-14 rounded-full object-cover outline outline-1 outline-white/10"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {draft.displayName}
          </p>
          <p className="truncate text-xs text-muted-foreground">@{draft.username}</p>
        </div>
      </div>

      <p className="text-pretty text-sm leading-6 text-muted-foreground">
        {draft.bio.trim() || "Taste note can come later."}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {[...draft.signals, ...draft.scenes].slice(0, 8).map((item) => (
          <span
            key={item}
            className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-[0.8rem] bg-background p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <Disc3 className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {selectedTrack ? selectedTrack.title : "First review"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {selectedTrack ? `first review prompt - ${selectedTrack.artist}` : "optional after onboarding"}
          </p>
        </div>
      </div>
    </div>
  );
}
