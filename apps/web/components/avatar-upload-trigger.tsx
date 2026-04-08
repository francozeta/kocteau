"use client";

import type { DragEventHandler } from "react";
import { Camera, CircleUserRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AvatarUploadTriggerProps = {
  alt: string;
  isDragging?: boolean;
  onClick: () => void;
  onDragEnter?: DragEventHandler<HTMLButtonElement>;
  onDragLeave?: DragEventHandler<HTMLButtonElement>;
  onDragOver?: DragEventHandler<HTMLButtonElement>;
  onDrop?: DragEventHandler<HTMLButtonElement>;
  previewUrl?: string | null;
  size?: "lg" | "md" | "sm";
};

const sizeClasses = {
  lg: {
    button: "size-32",
    icon: "size-6",
    badge: "size-9",
    badgeIcon: "size-[1.125rem]",
  },
  md: {
    button: "size-20",
    icon: "size-5",
    badge: "size-8",
    badgeIcon: "size-4",
  },
  sm: {
    button: "size-14",
    icon: "size-4",
    badge: "size-7",
    badgeIcon: "size-3.5",
  },
} as const;

export default function AvatarUploadTrigger({
  alt,
  isDragging = false,
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  previewUrl,
  size = "md",
}: AvatarUploadTriggerProps) {
  const scale = sizeClasses[size];

  return (
    <button
      type="button"
      aria-label={previewUrl ? "Change image" : "Upload image"}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-input border-dashed bg-background outline-none transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        previewUrl && "border-transparent bg-transparent",
        isDragging && "border-foreground/40 bg-accent/50",
        scale.button,
      )}
      data-dragging={isDragging || undefined}
      onClick={onClick}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={alt}
          className="size-full object-cover"
        />
      ) : (
        <CircleUserRoundIcon className={cn("text-muted-foreground/70", scale.icon)} />
      )}

      <span
        className={cn(
          "absolute right-0 bottom-0 inline-flex items-center justify-center rounded-full border border-background/80 bg-background/92 text-muted-foreground shadow-sm transition-colors group-hover:text-foreground",
          scale.badge,
        )}
      >
        <Camera className={scale.badgeIcon} />
      </span>
    </button>
  );
}
