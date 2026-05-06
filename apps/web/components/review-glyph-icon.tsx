import { cn } from "@/lib/utils";

export default function ReviewGlyphIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      aria-hidden="true"
      className={cn("icon size-5 shrink-0", className)}
    >
      <use
        href="/cdn/assets/sprites-core-6d2147a0.svg#3a5c87"
        fill="currentColor"
      />
    </svg>
  );
}
