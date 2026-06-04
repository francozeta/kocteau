"use client"

import type { CSSProperties } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconAlertOctagon } from "@/components/ui/icons"
import { Spinner } from "@/components/ui/spinner"

const Toaster = ({
  position = "bottom-right",
  offset = { bottom: "1.25rem", right: "1.25rem" },
  mobileOffset = { bottom: "calc(env(safe-area-inset-bottom) + 4.8rem)" },
  ...props
}: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="kocteau-toaster group"
      position={position}
      offset={offset}
      mobileOffset={mobileOffset}
      gap={8}
      visibleToasts={3}
      icons={{
        success: (
          <IconCircleCheck className="size-4" />
        ),
        info: (
          <IconInfoCircle className="size-4" />
        ),
        warning: (
          <IconAlertTriangle className="size-4" />
        ),
        error: (
          <IconAlertOctagon className="size-4" />
        ),
        loading: (
          <Spinner className="size-4" />
        ),
      }}
      style={
        {
          "--width": "17.5rem",
          "--normal-bg": "color-mix(in oklch, var(--kocteau-surface) 88%, black)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--kocteau-line)",
          "--border-radius": "999px",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "kocteau-toast",
          title: "kocteau-toast-title",
          description: "kocteau-toast-description",
          icon: "kocteau-toast-icon",
          actionButton: "kocteau-toast-action",
          cancelButton: "kocteau-toast-cancel",
          closeButton: "kocteau-toast-close",
          default: "kocteau-toast-default",
          success: "kocteau-toast-success",
          info: "kocteau-toast-info",
          warning: "kocteau-toast-warning",
          error: "kocteau-toast-error",
          loading: "kocteau-toast-loading",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
