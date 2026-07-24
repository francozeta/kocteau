"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Search } from "@/components/ui/icons";
import NewReviewDialog from "@/components/new-review-dialog";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import { cn } from "@/lib/utils";

const DitheringShader = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.Dithering),
  {
    ssr: false,
  },
);

type FeedReviewCtaProps = {
  isAuthenticated: boolean;
  className?: string;
};

export default function FeedReviewCta({
  isAuthenticated,
  className,
}: FeedReviewCtaProps) {
  const primaryLabel = isAuthenticated ? "Review a track" : "Find a track";
  const helper = isAuthenticated
    ? "Search a track and leave a signal for your feed."
    : "Browse freely. Log in only when you publish.";
  const trigger = (
    <button
      type="button"
      className="inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-[0.56rem] bg-foreground px-3.5 text-[13px] font-medium text-background transition-[background-color,transform] duration-150 ease-[var(--kocteau-ease)] hover:bg-foreground/88 active:scale-[0.96]"
    >
      <ReviewGlyphIcon className="size-3.5 shrink-0" />
      <span>{primaryLabel}</span>
    </button>
  );

  return (
    <section
      aria-label="Review prompt"
      className={cn(
        "kocteau-review-card relative isolate min-h-[9.5rem] overflow-hidden rounded-[var(--kocteau-radius-card)] px-4 py-4 sm:min-h-[10.25rem] sm:px-5 sm:py-5",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-35 mix-blend-screen">
        <DitheringShader
          colorBack="#050505"
          colorFront="#f4f4f5"
          height={460}
          scale={0.64}
          shape="swirl"
          size={2}
          speed={0.26}
          style={{ height: "100%", width: "100%" }}
          type="4x4"
          width={900}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_26%,rgba(255,255,255,0.13),transparent_24rem),linear-gradient(90deg,rgba(5,5,5,0.94),rgba(5,5,5,0.58)_50%,rgba(5,5,5,0.82))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),transparent_36%,rgba(0,0,0,0.22))]" />

      <div className="relative z-10 flex min-h-[7.5rem] flex-col justify-between gap-4 sm:min-h-[8rem] sm:flex-row sm:items-end">
        <div className="max-w-[25rem] space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/76">
            Review
          </p>
          <h2 className="text-balance font-heading text-[1.42rem] font-medium leading-[1.08] text-foreground sm:text-[1.7rem]">
            Find something to review.
          </h2>
          <p className="max-w-[22rem] text-pretty text-[13px] leading-5 text-muted-foreground/82 sm:text-[13.5px]">
            {helper}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <NewReviewDialog
            isAuthenticated={isAuthenticated}
            intent="review"
            trigger={trigger}
          />
          <Link
            href="/search"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.56rem] bg-foreground/[0.07] px-3 text-[13px] font-medium text-foreground/86 transition-[background-color,color,transform] duration-150 ease-[var(--kocteau-ease)] hover:bg-foreground/[0.11] hover:text-foreground active:scale-[0.96]"
          >
            <Search className="size-3.5" />
            <span>Explore</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
