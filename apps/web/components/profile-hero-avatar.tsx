import Image from "next/image";
import { getAvatarThumbnailUrl } from "@/lib/avatar-image-url";
import { cn } from "@/lib/utils";

type ProfileHeroAvatarProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  priority?: boolean;
};

const fallbackPatterns = [
  { angle: 132, spotX: 24, spotY: 18, ringOpacity: 0.12 },
  { angle: 156, spotX: 72, spotY: 20, ringOpacity: 0.1 },
  { angle: 118, spotX: 26, spotY: 76, ringOpacity: 0.14 },
  { angle: 144, spotX: 78, spotY: 70, ringOpacity: 0.11 },
  { angle: 168, spotX: 50, spotY: 16, ringOpacity: 0.13 },
  { angle: 120, spotX: 56, spotY: 82, ringOpacity: 0.12 },
] as const;

function getSeedValue(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
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

function getInitials(label: string) {
  const cleaned = label.trim();

  if (!cleaned) {
    return "K";
  }

  const segments = cleaned
    .replace(/^@/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (segments.length === 0) {
    return cleaned.slice(0, 2).toUpperCase();
  }

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase();
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

function isSvgAsset(value: string) {
  try {
    const pathname = value.startsWith("http")
      ? new URL(value).pathname
      : new URL(value, "https://kocteau.local").pathname;

    return pathname.toLowerCase().endsWith(".svg");
  } catch {
    return value.toLowerCase().includes(".svg");
  }
}

export default function ProfileHeroAvatar({
  avatarUrl,
  displayName,
  username,
  className,
  imageClassName,
  fallbackClassName,
  priority = false,
}: ProfileHeroAvatarProps) {
  const label = getAvatarLabel(displayName, username);
  const seed = username?.trim() || displayName?.trim() || "kocteau-user";
  const pattern = fallbackPatterns[getSeedValue(seed) % fallbackPatterns.length];
  const initials = getInitials(label);
  const resolvedAvatarUrl = avatarUrl ? getAvatarThumbnailUrl(avatarUrl) : avatarUrl;

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-full border border-border/28 bg-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:border-border/20",
        className,
      )}
      aria-label={label}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--muted)",
          backgroundImage: [
            `radial-gradient(circle at ${pattern.spotX}% ${pattern.spotY}%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 28%, transparent 46%)`,
            `linear-gradient(${pattern.angle}deg, color-mix(in oklch, var(--muted) 86%, var(--foreground)) 0%, color-mix(in oklch, var(--card) 74%, var(--background)) 52%, color-mix(in oklch, var(--background) 88%, var(--foreground)) 100%)`,
          ].join(", "),
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,${pattern.ringOpacity}), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      />

      {resolvedAvatarUrl ? (
        <Image
          src={resolvedAvatarUrl}
          alt={label}
          fill
          priority={priority}
          unoptimized={isSvgAsset(resolvedAvatarUrl)}
          sizes="(max-width: 640px) 96px, 112px"
          className={cn("relative z-[1] object-cover", imageClassName)}
        />
      ) : null}

      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 flex items-center justify-center text-3xl font-semibold text-foreground/92",
          fallbackClassName,
          resolvedAvatarUrl && "sr-only",
        )}
      >
        {initials}
      </span>
    </div>
  );
}
