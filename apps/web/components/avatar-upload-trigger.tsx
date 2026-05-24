"use client";

import type { DragEventHandler } from "react";
import { CameraIcon, UserCircleIcon } from "@phosphor-icons/react";
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
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/24 p-1 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_42px_rgba(0,0,0,0.24)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:border-white/16 hover:bg-white/[0.055] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/28",
        isDragging && "border-foreground/38 bg-white/[0.07] ring-2 ring-ring/24",
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
          className="size-full rounded-full object-cover"
        />
      ) : (
        <UserCircleIcon
          className={cn("text-muted-foreground/70", scale.icon)}
          weight="regular"
        />
      )}

      <span
        className={cn(
          "absolute bottom-0 right-0 inline-flex items-center justify-center rounded-full bg-foreground text-background shadow-[0_0_0_3px_var(--kocteau-surface),0_10px_28px_rgba(0,0,0,0.26)] transition-transform duration-150 ease-out group-hover:scale-[1.04]",
          scale.badge,
        )}
      >
        <CameraIcon className={scale.badgeIcon} weight="bold" />
      </span>
    </button>
  );
}
