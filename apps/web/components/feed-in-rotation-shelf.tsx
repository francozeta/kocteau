import SectionLinkHeading from "@/components/section-link-heading";
import StarterRouteCard from "@/components/starter-route-card";
import TrackCarousel from "@/components/track-carousel";
import type { StarterTrack } from "@/lib/starter";

type FeedInRotationShelfProps = {
  tracks: StarterTrack[];
};

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
        controlClassName="[--kocteau-carousel-cover-size:18rem]"
        fadeClassName="kocteau-carousel-mask-r-from-tight"
        itemClassName="basis-[13.5rem] xl:basis-[14rem]"
        viewportClassName="-mr-7 pr-7"
      >
        {visibleTracks.map((track, index) => (
          <StarterRouteCard
            key={track.id}
            track={track}
            priority={index < 4}
          />
        ))}
      </TrackCarousel>
    </section>
  );
}
