import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  priority?: boolean;
};

export default function BrandLogo({
  className,
  iconClassName,
  priority = false,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span
        className={cn(
          "relative block h-7 w-7 shrink-0 overflow-hidden",
          iconClassName,
        )}
      >
        <Image
          src="/logo.svg"
          alt="Kocteau logo"
          fill
          priority={priority}
          unoptimized
          sizes="(max-width: 640px) 32px, 40px"
          className="object-contain"
        />
      </span>
    </span>
  );
}
