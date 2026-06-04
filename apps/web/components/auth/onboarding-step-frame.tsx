"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "@/components/ui/icons";
import BrandLogo from "@/components/brand-logo";
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
  compact = false,
  controlClassName,
  panelClassName,
  liveMessage,
}: OnboardingStepFrameProps) {
  const prefersReducedMotion = useReducedMotion();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <main className="flex h-svh overflow-hidden flex-col bg-background text-foreground">
      <header
        className={cn(
          "mx-auto flex w-full max-w-[32rem] shrink-0 flex-col px-5 sm:px-8",
          compact ? "gap-2 pt-3 sm:pt-4" : "gap-3 pt-4 sm:pt-6",
        )}
      >
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex h-8 w-8 items-center justify-center text-foreground transition-[opacity,transform] duration-150 ease-out hover:opacity-80 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Go to Kocteau home"
          >
            <BrandLogo
              priority
              iconClassName={compact ? "h-[1.05rem] w-[1.05rem]" : "h-[1.35rem] w-[1.35rem]"}
            />
          </Link>
        </div>

        <div className={compact ? "space-y-2" : "space-y-3"}>
          <div
            className={cn(
              "flex items-end justify-between gap-4",
              compact ? "text-[12px]" : "text-sm",
            )}
          >
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
        <section
          className={cn(
            "flex min-h-0 items-center justify-center px-5 sm:px-8",
            compact ? "py-1.5 sm:py-3" : "py-3 sm:py-5",
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
                "flex h-full w-full max-w-[32rem] flex-col justify-center",
                compact
                  ? "max-h-[28rem] min-h-[20rem] gap-2"
                  : "max-h-[32rem] min-h-[25rem] gap-3",
                panelClassName,
              )}
            >
              <div
                className={cn(
                  "mx-auto max-w-[24rem] text-center",
                  compact ? "space-y-0.5" : "space-y-1.5",
                )}
              >
                <h1
                  className={cn(
                    "text-balance font-heading font-bold leading-tight tracking-tight text-foreground",
                    compact
                      ? "text-[1.25rem] sm:text-[1.35rem]"
                      : "text-[1.55rem] sm:text-[1.65rem]",
                  )}
                >
                  {title}
                </h1>
                {description ? (
                  <p
                    className={cn(
                      "text-pretty text-muted-foreground",
                      compact ? "text-[12px] leading-4" : "text-sm leading-5",
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
            "mx-auto flex w-full max-w-[32rem] shrink-0 items-center justify-between gap-4 px-5 sm:px-8",
            compact ? "h-24 pb-12 sm:h-16 sm:pb-5" : "h-28 pb-14 sm:h-20 sm:pb-7",
          )}
        >
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
            className={cn(
              "rounded-full transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]",
              compact ? "h-9 min-w-[7.75rem] px-4 text-[13px]" : "h-10 min-w-[8.75rem] px-5 text-sm",
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
