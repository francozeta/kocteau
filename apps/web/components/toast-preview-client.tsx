"use client"

import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
} from "@/components/ui/icons"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type ToastSample = {
  title: string
  description: string
  icon: ReactNode
  action: () => void
}

const samples: ToastSample[] = [
  {
    title: "Neutral",
    description: "Saved as a quiet app note.",
    icon: <IconInfoCircle className="size-3.5" />,
    action: () => {
      toast("Track note saved")
    },
  },
  {
    title: "Success",
    description: "Review and curation actions.",
    icon: <IconCircleCheck className="size-3.5" />,
    action: () => {
      toast.success("Review published")
    },
  },
  {
    title: "Warning",
    description: "Soft validation before a save.",
    icon: <IconAlertTriangle className="size-3.5" />,
    action: () => {
      toast.warning("Taste signal is thin")
    },
  },
  {
    title: "Destructive",
    description: "Errors without loud UI.",
    icon: <IconAlertOctagon className="size-3.5" />,
    action: () => {
      toast.error("Could not save review")
    },
  },
]

export function ToastPreviewClient() {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  const showLoadingPreview = () => {
    if (isLoadingPreview) return

    setIsLoadingPreview(true)
    const id = toast.loading("Saving taste")

    window.setTimeout(() => {
      toast.success("Taste updated", {
        id,
      })
      setIsLoadingPreview(false)
    }, 1600)
  }

  const showActionPreview = () => {
    toast("Log in to save reviews", {
      action: {
        label: "Log in",
        onClick: () => toast.success("Action clicked"),
      },
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 py-5 sm:py-6 lg:pb-10">
      <section className="border-b border-[var(--kocteau-line-soft)] pb-5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Studio
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-normal text-foreground">
          Toast preview
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          A small feedback surface for review, taste, and curation actions.
        </p>
      </section>

      <section className="grid gap-2 sm:grid-cols-2">
        {samples.map((sample) => (
          <button
            key={sample.title}
            type="button"
            onClick={sample.action}
            className="group flex min-h-24 items-start gap-3 rounded-[var(--kocteau-radius-card)] border border-[var(--kocteau-line-soft)] bg-[var(--kocteau-surface)] p-4 text-left transition-colors hover:border-[var(--kocteau-line)] hover:bg-[var(--kocteau-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <span
              className={cn(
                "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--kocteau-line-soft)] bg-[var(--kocteau-surface-control)] text-muted-foreground",
                sample.title === "Destructive" && "text-destructive",
              )}
            >
              {sample.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">
                {sample.title}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {sample.description}
              </span>
            </span>
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-[var(--kocteau-radius-card)] border border-[var(--kocteau-line-soft)] bg-[var(--kocteau-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Loading transition</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Uses the same classic loading mark as Notifications.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isLoadingPreview ? (
            <Spinner className="size-4 text-muted-foreground" />
          ) : null}
          <Button
            type="button"
            size="lg"
            className="rounded-full"
            onClick={showLoadingPreview}
            disabled={isLoadingPreview}
          >
            {isLoadingPreview ? "Saving" : "Show loading"}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[var(--kocteau-radius-card)] border border-[var(--kocteau-line-soft)] bg-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Action toast</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Mirrors the login prompt used from signed-out interactions.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-full"
          onClick={showActionPreview}
        >
          Show action
        </Button>
      </section>
    </div>
  )
}
