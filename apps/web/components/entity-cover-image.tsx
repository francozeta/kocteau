import Image from "next/image";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

type EntityCoverImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
  sizes: string;
  priority?: boolean;
  quality?: number;
};

export default function EntityCoverImage({
  src,
  alt,
  className,
  imageClassName,
  iconClassName,
  sizes,
  priority = false,
  quality = 64,
}: EntityCoverImageProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
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
