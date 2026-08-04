import Image from "next/image";
import GeneratedUserAvatar from "@/components/generated-user-avatar";
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
      {!resolvedAvatarUrl ? <GeneratedUserAvatar seed={seed} /> : null}

      {resolvedAvatarUrl ? (
        <Image
          src={resolvedAvatarUrl}
          alt={label}
          fill
          priority={priority}
          unoptimized
          sizes="(max-width: 640px) 96px, 112px"
          className={cn("z-[1] object-cover", imageClassName)}
        />
      ) : null}

      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 z-[1] flex items-center justify-center text-3xl font-semibold text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.72)]",
          fallbackClassName,
          resolvedAvatarUrl && "sr-only",
        )}
      >
        {initials}
      </span>
    </div>
  );
}
