import Image from "next/image";
import GeneratedUserAvatar from "@/components/generated-user-avatar";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { getAvatarThumbnailUrl } from "@/lib/avatar-image-url";
import { cn } from "@/lib/utils";

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
  sizes?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

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
  sizes,
  loading = "lazy",
  fetchPriority = "auto",
}: UserAvatarProps) {
  const label = getAvatarLabel(displayName, username);
  const seed = username?.trim() || displayName?.trim() || "kocteau-user";
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
  const resolvedSizes = sizes ?? (
    size === "sm" ? "24px" : size === "lg" ? "40px" : "32px"
  );
  const resolvedAvatarUrl = avatarUrl ? getAvatarThumbnailUrl(avatarUrl) : avatarUrl;

  return (
    <Avatar size={size} className={cn(shapeClasses.root, className)}>
      <AvatarFallback
        className={cn(
          shapeClasses.fallback,
          "relative overflow-hidden bg-muted font-medium text-white shadow-none",
          fallbackClassName,
        )}
      >
        {!resolvedAvatarUrl ? <GeneratedUserAvatar seed={seed} /> : null}
        <span className="relative z-[1] [text-shadow:0_1px_3px_rgb(0_0_0/0.72)]">
          {initials}
        </span>
      </AvatarFallback>
      {resolvedAvatarUrl ? (
        <Image
          src={resolvedAvatarUrl}
          alt={label}
          fill
          sizes={resolvedSizes}
          loading={loading}
          fetchPriority={fetchPriority}
          unoptimized
          className={cn(
            "z-[1] object-cover",
            shapeClasses.image,
            imageClassName,
          )}
        />
      ) : null}
    </Avatar>
  );
}
