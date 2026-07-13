import Link from "next/link";
import EntityCoverImage from "@/components/entity-cover-image";
import FeedReviewList from "@/components/feed-review-list";
import GuestProductPreview from "@/components/guest-product-preview";
import { SpotlightLogo } from "@/components/spotlight-logo";
import { ArrowRight, Search, Star } from "@/components/ui/icons";
import type { StarterTrack } from "@/lib/starter";
import type { FeedBundleQueryData } from "@/queries/feed";

type GuestHomeProps = {
  recentPage: FeedBundleQueryData;
  starterTracks: StarterTrack[];
};

function StarterCoverStack({ tracks }: { tracks: StarterTrack[] }) {
  const visibleTracks = tracks.slice(0, 4);

  if (visibleTracks.length === 0) {
    return (
      <div className="absolute inset-x-5 bottom-0 flex h-28 items-end justify-end gap-2" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="aspect-square w-[5.25rem] rounded-[0.72rem] border border-foreground/[0.08] bg-foreground/[0.035]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute -bottom-5 right-3 flex items-end sm:right-6">
      {visibleTracks.map((track, index) => (
        <EntityCoverImage
          key={track.id}
          src={track.cover_url}
          alt={`${track.title} by ${track.artist_name ?? "Unknown artist"}`}
          sizes="(max-width: 639px) 84px, 112px"
          variant="card"
          className="aspect-square w-[5.25rem] shrink-0 rounded-[0.72rem] border border-white/[0.1] bg-muted sm:w-28"
          imageClassName="saturate-[0.82]"
          quality={78}
          priority={index === 0}
        />
      ))}
    </div>
  );
}

function GuestHomeHero() {
  return (
    <header className="flex min-h-[58svh] items-center py-14 sm:min-h-[62svh] sm:py-16 lg:min-h-[64svh] lg:py-20">
      <div className="relative z-10 max-w-[52rem]">
        <h1 className="max-w-[43rem] text-balance font-serif text-[clamp(2.7rem,5.8vw,4.65rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground">
          Keep what the music left behind.
        </h1>
        <p className="mt-6 text-[14px] leading-6 text-muted-foreground/72 sm:text-[15px]">
          Music reviews from real listeners.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2.5">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-[13px] font-medium text-background transition-[background-color,transform] duration-150 ease-[var(--kocteau-ease)] hover:bg-foreground/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]"
          >
            Join Kocteau
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/reviews"
            className="inline-flex h-11 items-center justify-center rounded-full px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          >
            Read recent reviews
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProductFeatureGrid({ starterTracks }: { starterTracks: StarterTrack[] }) {
  return (
    <section className="mx-auto w-full max-w-[64rem]" aria-label="What you can do on Kocteau">
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/search"
          className="group relative min-h-[14.5rem] overflow-hidden rounded-[var(--kocteau-radius-card)] border border-foreground/[0.09] bg-[var(--kocteau-surface-raised)] p-5 transition-[background-color,border-color,transform] duration-200 ease-[var(--kocteau-ease)] hover:border-foreground/[0.14] hover:bg-[var(--kocteau-surface-raised-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.995] sm:col-span-2"
        >
          <div className="relative z-10 max-w-[19rem]">
            <span className="inline-flex size-8 items-center justify-center rounded-[0.55rem] bg-foreground/[0.065] text-muted-foreground transition-colors group-hover:text-foreground">
              <Search className="size-3.5" />
            </span>
            <h3 className="mt-4 text-balance font-serif text-[1.35rem] font-semibold leading-tight text-foreground">
              Find something worth writing down.
            </h3>
            <p className="mt-2 max-w-[17rem] text-pretty text-[13px] leading-5 text-muted-foreground/72">
              Search a track and leave the note you would want to find later.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%] bg-[linear-gradient(90deg,transparent,var(--kocteau-surface-raised)_78%)] opacity-40" />
          <StarterCoverStack tracks={starterTracks} />
        </Link>

        <article className="relative min-h-[16.5rem] overflow-hidden rounded-[var(--kocteau-radius-card)] border border-foreground/[0.09] bg-[var(--kocteau-surface-raised)] p-5">
          <h3 className="max-w-[15rem] text-balance font-serif text-[1.22rem] font-semibold leading-tight text-foreground">
            Leave more than a score.
          </h3>
          <p className="mt-2 text-pretty text-[12.5px] leading-5 text-muted-foreground/70">
            A rating starts the signal. A few words make it yours.
          </p>

          <div className="absolute inset-x-5 bottom-5 rounded-[0.62rem] border border-foreground/[0.08] bg-background/30 p-3.5">
            <div className="flex gap-1 text-foreground/88" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="size-3.5" fill="currentColor" stroke="currentColor" />
              ))}
            </div>
            <div className="mt-3 space-y-2" aria-hidden="true">
              <span className="block h-1.5 w-[88%] rounded-full bg-foreground/[0.12]" />
              <span className="block h-1.5 w-[63%] rounded-full bg-foreground/[0.07]" />
            </div>
          </div>
        </article>

        <article className="relative min-h-[16.5rem] overflow-hidden rounded-[var(--kocteau-radius-card)] border border-foreground/[0.09] bg-[var(--kocteau-surface-raised)] p-5">
          <h3 className="max-w-[15rem] text-balance font-serif text-[1.22rem] font-semibold leading-tight text-foreground">
            Let your taste shape the feed.
          </h3>
          <p className="mt-2 text-pretty text-[12.5px] leading-5 text-muted-foreground/70">
            Reviews, follows, and saves quietly tune what comes next.
          </p>

          <div className="absolute inset-x-5 bottom-5 space-y-2.5" aria-hidden="true">
            {[
              ["Reviews you finish", "74%"],
              ["People you follow", "58%"],
              ["Tracks you save", "42%"],
            ].map(([label, width]) => (
              <div key={label} className="space-y-1.5">
                <span className="text-[10.5px] text-muted-foreground/58">{label}</span>
                <span className="block h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                  <span className="block h-full rounded-full bg-foreground/35" style={{ width }} />
                </span>
              </div>
            ))}
          </div>
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
          className="text-balance font-serif text-[clamp(2.25rem,4.5vw,3.85rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-foreground"
        >
          Your taste is already a story.
        </h2>
        <p className="mt-5 max-w-[27rem] text-pretty text-[13px] leading-6 text-muted-foreground/72 sm:text-[14px]">
          Keep the records, ratings, and listening notes that made it yours.
        </p>
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-[13px] font-medium text-background transition-[background-color,transform] duration-150 ease-[var(--kocteau-ease)] hover:bg-foreground/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
          >
            Join Kocteau
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/reviews"
            className="inline-flex h-11 items-center justify-center rounded-full border border-foreground/[0.14] px-5 text-[13px] font-medium text-foreground/82 transition-[border-color,color,transform] duration-150 ease-[var(--kocteau-ease)] hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.97]"
          >
            Read music reviews
          </Link>
        </div>
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
    <div className="space-y-16 sm:space-y-20 lg:space-y-24">
      <div className="mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-10">
        <GuestHomeHero />
        <div className="-mt-7 sm:-mt-10 lg:-mt-14">
          <GuestProductPreview starterTracks={starterTracks} />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10">
        <ProductFeatureGrid starterTracks={starterTracks} />
      </div>

      {recentPage.feed.length > 0 ? (
        <section id="recent-reviews" aria-labelledby="recent-reviews-title" className="mx-auto w-full max-w-[69rem] scroll-mt-20 space-y-3 px-4 sm:px-6 lg:px-10">
          <div className="flex items-end justify-between gap-4 px-0.5">
            <h2 id="recent-reviews-title" className="font-serif text-[1.35rem] font-semibold text-foreground">
              Recently reviewed.
            </h2>
            <Link href="/reviews" className="text-[11.5px] font-medium text-muted-foreground/58 transition-colors hover:text-foreground">
              Explore more
            </Link>
          </div>
          <FeedReviewList
            view="latest"
            initialPage={recentPage}
            isAuthenticated={false}
            viewer={null}
            starterTracks={starterTracks}
            showReviewCta={false}
            showStarterShelf={false}
            enablePagination={false}
          />
        </section>
      ) : null}

      <GuestClosingCta />
    </div>
  );
}
