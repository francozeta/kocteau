"use client";

import { GradientAvatar } from "@outpacelabs/avatars";
import { cn } from "@/lib/utils";

export default function GeneratedUserAvatar({
  seed,
  className,
}: {
  seed: string | number;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={cn("absolute inset-0 overflow-hidden", className)}>
      <GradientAvatar
        seed={seed}
        size={256}
        pattern="dither"
        radius="inherit"
        className="size-full"
        style={{ width: "100%", height: "100%" }}
      />
    </span>
  );
}
