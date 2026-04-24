import Image from "next/image";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

type EntityCoverVariant = "thumbnail" | "card" | "hero";

type EntityCoverImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
  sizes: string;
  priority?: boolean;
  quality?: number;
  variant?: EntityCoverVariant;
};

const DEEZER_IMAGE_HOSTS = new Set([
  "e-cdns-images.dzcdn.net",
  "cdns-images.dzcdn.net",
  "cdn-images.dzcdn.net",
]);

function getOptimizedCoverSrc(
  src: string | null | undefined,
  variant: EntityCoverVariant,
) {
  if (!src || variant === "thumbnail") {
    return src ?? null;
  }

  try {
    const url = new URL(src);

    if (!DEEZER_IMAGE_HOSTS.has(url.hostname)) {
      return src;
    }

    const targetSize = variant === "hero" ? "1000x1000" : "500x500";

    url.pathname = url.pathname.replace(/\/\d+x\d+-/i, `/${targetSize}-`);
    return url.toString();
  } catch {
    return src;
  }
}

export default function EntityCoverImage({
  src,
  alt,
  className,
  imageClassName,
  iconClassName,
  sizes,
  priority = false,
  quality,
  variant = "thumbnail",
}: EntityCoverImageProps) {
  const resolvedSrc = getOptimizedCoverSrc(src, variant);
  const resolvedQuality =
    quality ?? (variant === "hero" ? 88 : variant === "card" ? 84 : 70);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      {resolvedSrc ? (
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          sizes={sizes}
          quality={resolvedQuality}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <Music2 className={cn("text-muted-foreground", iconClassName)} />
      )}
    </div>
  );
}
