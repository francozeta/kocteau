"use client";

import type { FormEvent, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "@/components/ui/icons";
import BrandLogo from "@/components/brand-logo";
import { OnboardingProgressBar } from "@/components/auth/onboarding-progress-bar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type OnboardingStepFrameProps = {
  section: string;
  currentStep: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  error?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack?: () => void;
  backDisabled?: boolean;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  submitIcon?: ReactNode;
  compact?: boolean;
  controlClassName?: string;
  panelClassName?: string;
  liveMessage?: string;
};

export default function OnboardingStepFrame({
  section,
  currentStep,
  totalSteps,
  title,
  description,
  children,
  error,
  onSubmit,
  onBack,
  backDisabled = currentStep === 1,
  submitLabel = "Continue",
  submitDisabled = false,
  submitLoading = false,
  submitIcon,
  controlClassName,
  panelClassName,
  liveMessage,
}: OnboardingStepFrameProps) {
  const prefersReducedMotion = useReducedMotion();
  const progress = (currentStep / totalSteps) * 100;
  const canGoBack = Boolean(onBack) && !backDisabled && !submitLoading;

  return (
    <main className="relative isolate flex h-svh overflow-hidden flex-col bg-background text-foreground">
      <OnboardingProgressBar value={progress} />
      <header
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-[31rem] shrink-0 flex-col px-5 sm:px-8",
          "pt-5 sm:pt-6",
        )}
      >
        <div className="flex justify-center">
          <div className="inline-flex h-8 w-8 items-center justify-center text-foreground">
            <BrandLogo
              priority
              iconClassName="h-[1.35rem] w-[1.35rem]"
            />
          </div>
        </div>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]"
      >
        <section
          className={cn(
            "flex min-h-0 items-center justify-center px-5 sm:px-8",
            "py-2 sm:py-3",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${section}-${currentStep}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "flex h-full min-h-0 w-full max-w-[32rem] flex-col justify-center gap-3",
                panelClassName,
              )}
            >
              <div
                className={cn(
                  "mx-auto max-w-[24rem] text-center",
                  "space-y-1.5",
                )}
              >
                <h1
                  className={cn(
                    "text-balance font-heading text-[1.55rem] font-medium leading-tight tracking-tight text-foreground sm:text-[1.65rem]",
                  )}
                >
                  {title}
                </h1>
                {description ? (
                  <p
                    className={cn(
                      "text-pretty text-sm leading-5 text-muted-foreground",
                    )}
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              <div
                className={cn(
                  "mx-auto flex min-h-0 w-full max-w-[28rem] items-center justify-center px-1 py-1",
                  controlClassName,
                )}
              >
                {children}
              </div>

              <div className="min-h-5 text-center text-xs text-destructive">
                {error}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        <footer
          className={cn(
            "mx-auto flex h-[4.75rem] w-full max-w-[32rem] shrink-0 items-center justify-between gap-4 pb-5 pl-5 pr-[5.5rem] sm:h-[4.5rem] sm:px-8 sm:pb-5",
          )}
        >
          {canGoBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={onBack}
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
            disabled={submitDisabled || submitLoading}
            className={cn(
              "h-10 min-w-[8.75rem] rounded-full px-5 text-sm transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]",
            )}
          >
            {submitLoading ? <Spinner className="size-3.5" /> : null}
            {submitLabel}
            {!submitLoading ? submitIcon : null}
          </Button>
        </footer>
      </form>

      {liveMessage ? (
        <span className="sr-only" aria-live="polite">
          {liveMessage}
        </span>
      ) : null}
    </main>
  );
}
