import PrefetchLink from "@/components/prefetch-link";
import SectionLinkHeading from "@/components/section-link-heading";
import TrackCarousel from "@/components/track-carousel";
import TrackTile from "@/components/track-tile";
import type { StarterTrack } from "@/lib/starter";

type FeedInRotationShelfProps = {
  tracks: StarterTrack[];
};

function getStarterTrackHref(track: StarterTrack) {
  return `/search?seed=${encodeURIComponent(track.provider_id)}`;
}

export default function FeedInRotationShelf({
  tracks,
}: FeedInRotationShelfProps) {
  const visibleTracks = tracks.slice(0, 8);

  if (visibleTracks.length === 0) {
    return null;
  }

  return (
    <section
      className="hidden space-y-3.5 lg:block"
      aria-labelledby="feed-discovery-seeds-title"
    >
      <SectionLinkHeading id="feed-discovery-seeds-title" href="/search">
        Start a route
      </SectionLinkHeading>

      <TrackCarousel
        ariaLabel="Discovery starting points"
        compactControls
        contentClassName="gap-3"
        controlClassName="[--kocteau-carousel-cover-size:8.25rem]"
        fadeClassName="kocteau-carousel-mask-r-from-tight"
        itemClassName="basis-[8.25rem]"
        viewportClassName="-mr-2 pr-2"
      >
        {visibleTracks.map((track, index) => (
          <PrefetchLink
            key={track.id}
            href={getStarterTrackHref(track)}
            className="group block rounded-[0.78rem] outline-none transition-opacity duration-150 hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/55"
            aria-label={`Start a discovery route from ${track.title} by ${track.artist_name ?? "Unknown artist"}`}
          >
            <TrackTile
              title={track.title}
              artistName={track.artist_name}
              coverUrl={track.cover_url}
              sizes="132px"
              quality={82}
              priority={index < 4}
              coverClassName="rounded-[0.7rem]"
              titleClassName="text-[13px] font-semibold leading-4 group-hover:text-foreground"
              artistClassName="text-[12px] leading-4 text-muted-foreground/66"
            />
          </PrefetchLink>
        ))}
      </TrackCarousel>
    </section>
  );
}
