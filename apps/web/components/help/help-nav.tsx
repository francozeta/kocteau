"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { helpDocuments } from "@/lib/help";
import { cn } from "@/lib/utils";

type HelpNavProps = {
  variant?: "rail";
};

export default function HelpNav({ variant = "rail" }: HelpNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Help sections"
      className={cn(
        "min-w-0",
        variant === "rail" && "space-y-1",
      )}
    >
      {helpDocuments.map((document) => {
        const isActive = pathname === document.href;

        return (
          <Link
            key={document.slug}
            href={document.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center rounded-[0.46rem] font-medium transition-colors",
              variant === "rail" && "flex h-9 px-3 text-[13px]",
              isActive
                ? "bg-foreground/[0.075] text-foreground"
                : "text-muted-foreground/70 hover:bg-foreground/[0.045] hover:text-foreground/88",
            )}
          >
            {document.label}
          </Link>
        );
      })}
    </nav>
  );
}
