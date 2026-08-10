import Link from "next/link";
import { KocteauChevronLeftSmallIcon } from "@/components/kocteau-icons";

export default function LibraryRouteHeader({
  title,
  description,
  count,
}: {
  title: string;
  description: string;
  count: number;
}) {
  return (
    <header className="space-y-4">
      <Link
        href="/library"
        className="inline-flex min-h-10 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-xs font-medium text-muted-foreground transition-[transform,color,background-color] duration-150 hover:bg-white/[0.12] hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
      >
        <KocteauChevronLeftSmallIcon className="size-4" />
        Library
      </Link>
      <div className="space-y-1.5">
        <h1 className="font-heading text-[2rem] font-medium tracking-tight text-foreground sm:text-[2.35rem]">
          {title}
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        <p className="text-xs font-medium tabular-nums text-muted-foreground/80">
          {count} {count === 1 ? "item" : "items"}
        </p>
      </div>
    </header>
  );
}
