"use client";

import { motion, useReducedMotion } from "motion/react";

type OnboardingProgressBarProps = {
  value: number;
};

export function OnboardingProgressBar({ value }: OnboardingProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const progressScale = Math.min(Math.max(value / 100, 0), 1);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 z-20 h-1 overflow-hidden bg-border/25"
    >
      <motion.div
        className="h-full origin-left bg-foreground"
        initial={false}
        animate={{ scaleX: progressScale }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: "spring", duration: 0.32, bounce: 0 }
        }
      />
    </div>
  );
}
