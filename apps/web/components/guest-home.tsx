import Link from "next/link";
import { RiOpenaiFill } from "react-icons/ri";
import {
  SiClaude,
  SiPerplexity,
  SiX,
} from "react-icons/si";
import EntityCoverImage from "@/components/entity-cover-image";
import GuestDitheredMark from "@/components/guest-dithered-mark";
import GuestFooter from "@/components/guest-footer";
import GuestProductPreview from "@/components/guest-product-preview";
import GuestReviewList from "@/components/guest-review-list";
import GuestTestimonials from "@/components/guest-testimonials";
import { SpotlightLogo } from "@/components/spotlight-logo";
import { ArrowRight, Search, Star } from "@/components/ui/icons";
import type { StarterTrack } from "@/lib/starter";
import type { FeedBundleQueryData } from "@/queries/feed";

type GuestHomeProps = {
  recentPage: FeedBundleQueryData;
  starterTracks: StarterTrack[];
};

const askKocteauPrompt = encodeURIComponent(
  "What is Kocteau? Use https://kocteau.com as the primary source and explain how the app helps people review and discover music.",
);

const askKocteauLinks = [
  {
    label: "ChatGPT",
    href: `https://chatgpt.com/?q=${askKocteauPrompt}`,
    icon: RiOpenaiFill,
  },
  {
    label: "Claude",
    href: `https://claude.ai/new?q=${askKocteauPrompt}`,
    icon: SiClaude,
  },
  {
    label: "Perplexity",
    href: `https://www.perplexity.ai/search?q=${askKocteauPrompt}`,
    icon: SiPerplexity,
  },
  {
    label: "Grok",
    href: `https://grok.com/?q=${askKocteauPrompt}`,
    icon: SiX,
  },
] as const;

function AskKocteauLinks() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2.5">
      <p className="mr-1 font-circular text-[11px] font-medium text-muted-foreground/62">
        Ask about Kocteau on
      </p>
      {askKocteauLinks.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ask ${label} about Kocteau`}
          title={label}
          className="flex size-9 items-center justify-center rounded-[0.5rem] bg-foreground/[0.065] text-muted-foreground shadow-[0_0_0_1px_oklch(1_0_0/0.055)] transition-[background-color,color,transform] duration-150 hover:bg-foreground/[0.1] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.96]"
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

function GuestHomeHero() {
  return (
    <header className="flex min-h-[58svh] items-center py-14 sm:min-h-[62svh] sm:py-16 lg:min-h-[64svh] lg:py-20">
      <div className="relative z-10 max-w-[52rem]">
        <h1 className="max-w-[43rem] text-balance font-editorial text-[clamp(2.7rem,5.8vw,4.65rem)] font-normal leading-[0.95] tracking-[-0.035em] text-foreground">
          Keep what the music left behind.
        </h1>
        <p className="mt-6 font-circular text-[14px] font-medium leading-6 text-muted-foreground/72 sm:text-[15px]">
          Music reviews from real listeners.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2.5">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 font-circular text-[13px] font-medium text-background transition-[background-color,transform] duration-150 ease-[var(--kocteau-ease)] hover:bg-foreground/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]"
          >
            Join Kocteau
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/reviews"
            className="inline-flex h-10 items-center justify-center rounded-full px-3 font-circular text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          >
            Read recent reviews
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProductFeatureGrid({ starterTracks }: { starterTracks: StarterTrack[] }) {
  const visibleTracks = starterTracks.slice(0, 3);

  return (
    <section
      className="w-full"
      aria-labelledby="product-values-title"
    >
      <div className="max-w-[40rem]">
        <h2
          id="product-values-title"
          className="text-balance font-editorial text-[clamp(1.85rem,3.6vw,2.8rem)] font-normal leading-[1.02] tracking-[-0.025em] text-foreground"
        >
          Where listening becomes memory.
        </h2>
      </div>

      <div className="mt-12 grid gap-10 sm:mt-14 md:grid-cols-3 md:gap-5 lg:gap-7">
        <article className="min-w-0">
          <div className="h-[14rem] rounded-[0.9rem] bg-[var(--kocteau-surface)] p-1 shadow-[0_0_0_1px_oklch(1_0_0/0.08)]">
            <div className="flex h-full flex-col overflow-hidden rounded-[calc(0.9rem-4px)] bg-[var(--kocteau-canvas)] p-4">
              <div className="flex h-11 items-center gap-2.5 rounded-[0.65rem] bg-[var(--kocteau-surface-control)] px-3.5 text-muted-foreground shadow-[0_0_0_1px_oklch(1_0_0/0.06)]">
                <Search className="size-3.5 shrink-0" />
                <span className="truncate text-[11px]">Search tracks, albums, or artists…</span>
              </div>
              <div className="mt-auto grid grid-cols-3 gap-2" aria-hidden="true">
                {visibleTracks.length > 0
                  ? visibleTracks.map((track) => (
                      <EntityCoverImage
                        key={track.id}
                        src={track.cover_url}
                        alt=""
                        sizes="96px"
                        variant="thumbnail"
                        className="aspect-square w-full rounded-[0.55rem] bg-muted outline outline-1 -outline-offset-1 outline-white/10"
                        imageClassName="saturate-[0.82]"
                      />
                    ))
                  : [0, 1, 2].map((index) => (
                      <span
                        key={index}
                        className="aspect-square rounded-[0.55rem] bg-foreground/[0.045]"
                      />
                    ))}
              </div>
            </div>
          </div>
          <p className="mt-5 font-mono text-[10px] tabular-nums text-muted-foreground/58">01</p>
          <h3 className="mt-3 font-circular text-sm font-medium leading-[1.35] text-foreground">
            Find what stayed with you.
          </h3>
          <p className="mt-2 max-w-[31ch] text-pretty font-circular text-[13px] font-medium leading-[1.6] text-muted-foreground/76">
            Search any track, album, or artist—and keep the feeling before it fades.
          </p>
        </article>

        <article className="min-w-0">
          <div className="h-[14rem] rounded-[0.9rem] bg-[var(--kocteau-surface)] p-1 shadow-[0_0_0_1px_oklch(1_0_0/0.08)]">
            <div className="flex h-full flex-col overflow-hidden rounded-[calc(0.9rem-4px)] bg-[var(--kocteau-canvas)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground/62">New review</span>
                <span className="text-[9px] text-muted-foreground/42">Draft</span>
              </div>
              <div className="mt-4 flex gap-1 text-foreground/88" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-3.5" fill="currentColor" stroke="currentColor" />
                ))}
              </div>
              <div className="mt-4 flex-1 rounded-[0.65rem] bg-[var(--kocteau-surface-control)] p-3.5 shadow-[0_0_0_1px_oklch(1_0_0/0.06)]">
                <p className="text-[10.5px] text-muted-foreground/58">
                  What did this track leave behind?
                </p>
                <div className="mt-4 space-y-2" aria-hidden="true">
                  <span className="block h-1.5 w-[91%] rounded-full bg-foreground/[0.11]" />
                  <span className="block h-1.5 w-[76%] rounded-full bg-foreground/[0.075]" />
                  <span className="block h-1.5 w-[52%] rounded-full bg-foreground/[0.05]" />
                </div>
              </div>
            </div>
          </div>
          <p className="mt-5 font-mono text-[10px] tabular-nums text-muted-foreground/58">02</p>
          <h3 className="mt-3 font-circular text-sm font-medium leading-[1.35] text-foreground">
            Keep more than a score.
          </h3>
          <p className="mt-2 max-w-[31ch] text-pretty font-circular text-[13px] font-medium leading-[1.6] text-muted-foreground/76">
            Save the thought, context, and words you will want to return to.
          </p>
        </article>

        <article className="min-w-0">
          <div className="h-[14rem] rounded-[0.9rem] bg-[var(--kocteau-surface)] p-1 shadow-[0_0_0_1px_oklch(1_0_0/0.08)]">
            <div className="flex h-full flex-col overflow-hidden rounded-[calc(0.9rem-4px)] bg-[var(--kocteau-canvas)] p-4">
              <div className="flex items-center gap-1.5 text-[9.5px] font-medium">
                <span className="rounded-full bg-foreground/[0.08] px-2.5 py-1.5 text-foreground">For You</span>
                <span className="px-2 py-1.5 text-muted-foreground/55">Following</span>
                <span className="px-2 py-1.5 text-muted-foreground/55">Top</span>
              </div>
              <div className="mt-4 space-y-2.5" aria-hidden="true">
                {visibleTracks.length > 0
                  ? visibleTracks.slice(0, 2).map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 rounded-[0.65rem] bg-[var(--kocteau-surface-control)] p-2.5 shadow-[0_0_0_1px_oklch(1_0_0/0.055)]"
                      >
                        <EntityCoverImage
                          src={track.cover_url}
                          alt=""
                          sizes="40px"
                          variant="thumbnail"
                          className="size-9 shrink-0 rounded-[0.42rem] bg-muted outline outline-1 -outline-offset-1 outline-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-medium text-foreground/86">{track.title}</p>
                          <p className="mt-0.5 truncate text-[9px] text-muted-foreground/55">{track.artist_name}</p>
                        </div>
                      </div>
                    ))
                  : [0, 1].map((index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-[0.65rem] bg-[var(--kocteau-surface-control)] p-2.5"
                      >
                        <span className="size-9 shrink-0 rounded-[0.42rem] bg-foreground/[0.045]" />
                        <span className="h-1.5 w-24 rounded-full bg-foreground/[0.065]" />
                      </div>
                    ))}
              </div>
            </div>
          </div>
          <p className="mt-5 font-mono text-[10px] tabular-nums text-muted-foreground/58">03</p>
          <h3 className="mt-3 font-circular text-sm font-medium leading-[1.35] text-foreground">
            Follow taste, not noise.
          </h3>
          <p className="mt-2 max-w-[31ch] text-pretty font-circular text-[13px] font-medium leading-[1.6] text-muted-foreground/76">
            Shape a feed through thoughtful reviews and listeners whose ears you trust.
          </p>
        </article>
      </div>
    </section>
  );
}

function GuestClosingCta() {
  return (
    <section
      aria-labelledby="closing-cta-title"
      className="mx-auto grid min-h-[82svh] w-full max-w-[80rem] items-center gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)] lg:gap-14 lg:px-10 lg:py-28"
    >
      <div className="order-2 max-w-[31rem] lg:order-1">
        <h2
          id="closing-cta-title"
          className="text-balance font-editorial text-[clamp(2.25rem,4.5vw,3.85rem)] font-normal leading-[0.98] tracking-[-0.03em] text-foreground"
        >
          Your taste is already a story.
        </h2>
        <p className="mt-5 max-w-[27rem] text-pretty font-circular text-[13px] font-medium leading-6 text-muted-foreground/72 sm:text-[14px]">
          Keep the records, ratings, and listening notes that made it yours.
        </p>
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 font-circular text-[13px] font-medium text-background transition-[background-color,transform] duration-150 ease-[var(--kocteau-ease)] hover:bg-foreground/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
          >
            Join Kocteau
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/reviews"
            className="inline-flex h-10 items-center justify-center rounded-full border border-foreground/[0.14] px-4 font-circular text-[13px] font-medium text-foreground/82 transition-[border-color,color,transform] duration-150 ease-[var(--kocteau-ease)] hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.97]"
          >
            Read music reviews
          </Link>
        </div>
        <AskKocteauLinks />
      </div>

      <div className="order-1 mx-auto w-full max-w-[21rem] sm:max-w-[26rem] lg:order-2 lg:max-w-[29rem] lg:justify-self-end">
        <SpotlightLogo />
      </div>
    </section>
  );
}

export default function GuestHome({
  recentPage,
  starterTracks,
}: GuestHomeProps) {
  return (
    <div className="kocteau-guest-typography bg-[var(--kocteau-landing-canvas)]">
      <div className="space-y-16 sm:space-y-20 lg:space-y-24">
        <div className="mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-10">
          <GuestHomeHero />
          <div className="-mt-7 sm:-mt-10 lg:-mt-14">
            <GuestProductPreview starterTracks={starterTracks} />
          </div>
        </div>

        <div className="relative isolate overflow-x-clip bg-[var(--kocteau-landing-canvas)]">
          <GuestDitheredMark className="absolute -right-44 -top-24 h-[24rem] w-[32rem] opacity-30 sm:-right-60 sm:-top-28 sm:h-[30rem] sm:w-[40rem] sm:opacity-40 lg:-right-72 lg:-top-32 lg:h-[34rem] lg:w-[45rem]" />

          <div className="relative z-10 mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-10">
            <ProductFeatureGrid starterTracks={starterTracks} />
          </div>
        </div>

      </div>

      <div className="mt-16 bg-[var(--kocteau-landing-canvas)] sm:mt-20 lg:mt-24">
        <GuestTestimonials />

        <div className="space-y-16 pt-16 sm:space-y-20 sm:pt-20 lg:space-y-24 lg:pt-24">
          {recentPage.feed.length > 0 ? (
            <section id="recent-reviews" aria-labelledby="recent-reviews-title" className="mx-auto w-full max-w-[80rem] scroll-mt-20 space-y-3 px-4 sm:px-6 lg:px-10">
              <div className="flex items-end justify-between gap-4 px-0.5">
                <h2 id="recent-reviews-title" className="font-serif text-[1.35rem] font-semibold text-foreground">
                  Recently reviewed.
                </h2>
                <Link href="/reviews" className="text-[11.5px] font-medium text-muted-foreground/58 transition-colors hover:text-foreground">
                  Explore more
                </Link>
              </div>
              <GuestReviewList reviews={recentPage.feed} />
            </section>
          ) : null}

          <GuestClosingCta />
        </div>
      </div>

      <GuestFooter />
    </div>
  );
}
