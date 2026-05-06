"use client";

import { Disc3, ListMusic } from "lucide-react";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperLabel,
  StepperList,
  StepperSeparator,
} from "@/components/ui/stepper";
import { cn } from "@/lib/utils";

type OnboardingStep = "profile" | "taste";

type OnboardingProgressProps = {
  currentStep: OnboardingStep;
};

const onboardingSteps = [
  {
    value: "profile",
    title: "Profile",
    description: "Disc and identity",
    icon: Disc3,
  },
  {
    value: "taste",
    title: "Taste",
    description: "Signals for For You",
    icon: ListMusic,
  },
] satisfies Array<{
  value: OnboardingStep;
  title: string;
  description: string;
  icon: typeof Disc3;
}>;

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <Stepper
      value={currentStep}
      className="gap-0 rounded-[var(--kocteau-radius-control)] bg-[var(--kocteau-surface-control)] p-1.5 shadow-[var(--kocteau-shadow-control)]"
    >
      <StepperList className="gap-1 overflow-visible pb-0">
        {onboardingSteps.map((item) => {
          const Icon = item.icon;
          const active = item.value === currentStep;
          const completed = item.value === "profile" && currentStep === "taste";

          return (
            <StepperItem
              key={item.value}
              value={item.value}
              completed={completed}
              className="min-w-0 [--stepper-indicator-size:2rem] data-[orientation=horizontal]:min-w-0"
            >
              <div
                className={cn(
                  "flex w-full min-w-0 items-center gap-2 rounded-[calc(var(--kocteau-radius-control)-0.2rem)] px-2.5 py-2 text-left transition-colors",
                  active
                    ? "bg-[var(--kocteau-surface-raised)] text-foreground"
                    : completed
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                <StepperIndicator
                  className={cn(
                    "rounded-md border-0 shadow-none",
                    active || completed
                      ? "bg-foreground text-background"
                      : "bg-background/55 text-muted-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                </StepperIndicator>
                <span className="min-w-0">
                  <StepperLabel className="block max-w-none truncate text-[0.78rem] font-semibold leading-4">
                    {item.title}
                  </StepperLabel>
                  <StepperDescription className="hidden truncate text-[0.68rem] leading-4 text-muted-foreground sm:block">
                    {item.description}
                  </StepperDescription>
                </span>
              </div>
              <StepperSeparator className="hidden" />
            </StepperItem>
          );
        })}
      </StepperList>
    </Stepper>
  );
}
