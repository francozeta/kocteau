"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
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
            <span className="font-medium text-foreground">{section}</span>
            <span className="tabular-nums text-muted-foreground">
              {currentStep} / {totalSteps}
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
        onSubmit={onSubmit}
        className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]"
      >
        <section className="flex min-h-0 items-center justify-center px-5 py-3 sm:px-8 sm:py-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${section}-${currentStep}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "flex h-full max-h-[32rem] min-h-[25rem] w-full max-w-[32rem] flex-col justify-center gap-3",
                panelClassName,
              )}
            >
              <div className="mx-auto max-w-[24rem] space-y-1.5 text-center">
                <h1 className="text-balance font-heading text-[1.55rem] font-bold leading-tight tracking-tight text-foreground sm:text-[1.65rem]">
                  {title}
                </h1>
                {description ? (
                  <p className="text-pretty text-sm leading-5 text-muted-foreground">
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

        <footer className="mx-auto flex h-28 w-full max-w-[32rem] shrink-0 items-center justify-between gap-4 px-5 pb-14 sm:h-20 sm:px-8 sm:pb-7">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={onBack}
            disabled={backDisabled || submitLoading}
            aria-label="Go back"
            className="size-10 rounded-full bg-foreground/[0.04] text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out hover:bg-foreground/[0.08] hover:text-foreground active:scale-[0.96]"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="min-w-0 flex-1" aria-hidden="true" />

          <Button
            type="submit"
            size="lg"
            disabled={submitDisabled || submitLoading}
            className="h-10 min-w-[8.75rem] rounded-full px-5 text-sm transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]"
          >
            {submitLoading ? <LoaderCircle className="size-4 animate-spin" /> : null}
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
