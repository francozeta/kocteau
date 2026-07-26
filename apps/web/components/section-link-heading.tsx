import type { ReactNode } from "react";
import PrefetchLink from "@/components/prefetch-link";
import { ChevronRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type SectionLinkHeadingProps = {
  children: ReactNode;
  href: string;
  className?: string;
  id?: string;
};

export default function SectionLinkHeading({
  children,
  href,
  className,
  id,
}: SectionLinkHeadingProps) {
  return (
    <h2 id={id} className={cn("text-[15px] font-semibold leading-tight", className)}>
      <PrefetchLink
        href={href}
        className="group inline-flex min-h-8 items-center gap-0.5 rounded-[0.45rem] pr-1 text-foreground/90 outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/55"
      >
        <span>{children}</span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground/58 transition-[color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-muted-foreground/78"
        />
      </PrefetchLink>
    </h2>
  );
}
