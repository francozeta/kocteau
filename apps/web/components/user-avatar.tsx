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
  size?: "default" | "sm" | "lg";
  shape?: "circle" | "soft";
  sizes?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
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

export default function UserAvatar({
  avatarUrl,
  displayName,
  username,
  className,
  imageClassName,
  size = "default",
  shape = "circle",
  sizes,
  loading = "lazy",
  fetchPriority = "auto",
}: UserAvatarProps) {
  const label = getAvatarLabel(displayName, username);
  const seed = username?.trim() || displayName?.trim() || "kocteau-user";
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
          "relative overflow-hidden bg-muted shadow-none",
        )}
      >
        {!resolvedAvatarUrl ? <GeneratedUserAvatar seed={seed} /> : null}
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
