import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type UserAvatarProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  size?: "default" | "sm" | "lg";
  shape?: "circle" | "soft";
  initialsLength?: 1 | 2;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

const fallbackPatterns = [
  {
    angle: 132,
    spotX: 24,
    spotY: 18,
    ringOpacity: 0.12,
  },
  {
    angle: 156,
    spotX: 72,
    spotY: 20,
    ringOpacity: 0.1,
  },
  {
    angle: 118,
    spotX: 26,
    spotY: 76,
    ringOpacity: 0.14,
  },
  {
    angle: 144,
    spotX: 78,
    spotY: 70,
    ringOpacity: 0.11,
  },
  {
    angle: 168,
    spotX: 50,
    spotY: 16,
    ringOpacity: 0.13,
  },
  {
    angle: 120,
    spotX: 56,
    spotY: 82,
    ringOpacity: 0.12,
  },
] as const;

function getSeedValue(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getInitials(label: string, initialsLength: 1 | 2) {
  const cleaned = label.trim();

  if (!cleaned) {
    return "K";
  }

  const segments = cleaned
    .replace(/^@/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (segments.length === 0) {
    return cleaned.slice(0, initialsLength).toUpperCase();
  }

  if (initialsLength === 1 || segments.length === 1) {
    return segments[0].slice(0, initialsLength).toUpperCase();
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

function getAvatarLabel(displayName?: string | null, username?: string | null) {
  if (displayName?.trim()) {
    return displayName.trim();
  }

  if (username?.trim()) {
    return `@${username.trim()}`;
  }

  return "Kocteau user";
}

export default function UserAvatar({
  avatarUrl,
  displayName,
  username,
  className,
  imageClassName,
  fallbackClassName,
  size = "default",
  shape = "circle",
  initialsLength = 1,
  loading = "lazy",
  fetchPriority = "auto",
}: UserAvatarProps) {
  const label = getAvatarLabel(displayName, username);
  const seed = username?.trim() || displayName?.trim() || "kocteau-user";
  const pattern = fallbackPatterns[getSeedValue(seed) % fallbackPatterns.length];
  const initials = getInitials(label, initialsLength);
  const shapeClasses = shape === "soft"
    ? {
        root: "!rounded-[1.25rem] after:!rounded-[1.25rem]",
        image: "!rounded-[1.25rem]",
        fallback: "!rounded-[1.25rem]",
      }
    : {
        root: "",
        image: "",
        fallback: "",
      };
  const fallbackStyle: CSSProperties = {
    backgroundColor: "var(--muted)",
    backgroundImage: [
      `radial-gradient(circle at ${pattern.spotX}% ${pattern.spotY}%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 28%, transparent 46%)`,
      `linear-gradient(${pattern.angle}deg, color-mix(in oklch, var(--muted) 86%, var(--foreground)) 0%, color-mix(in oklch, var(--card) 74%, var(--background)) 52%, color-mix(in oklch, var(--background) 88%, var(--foreground)) 100%)`,
    ].join(", "),
    boxShadow: `inset 0 0 0 1px rgba(255,255,255,${pattern.ringOpacity}), inset 0 1px 0 rgba(255,255,255,0.06)`,
  };

  return (
    <Avatar size={size} className={cn(shapeClasses.root, className)}>
      <AvatarImage
        src={avatarUrl ?? undefined}
        alt={label}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={cn(shapeClasses.image, imageClassName)}
      />
      <AvatarFallback
        style={fallbackStyle}
        className={cn(
          shapeClasses.fallback,
          "font-medium text-foreground/92 shadow-none",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
