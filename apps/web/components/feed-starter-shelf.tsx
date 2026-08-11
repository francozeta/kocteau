"use client";

import { useEffect, useMemo, useRef } from "react";
import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import SectionLinkHeading from "@/components/section-link-heading";
import TrackCarousel from "@/components/track-carousel";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { getDiscoverySeedPath } from "@/lib/discovery/seed";
import type { StarterTrack } from "@/lib/starter";
import { cn } from "@/lib/utils";

type FeedStarterShelfProps = {
  tracks: StarterTrack[];
  isAuthenticated: boolean;
  variant?: "editorial" | "personalized";
  className?: string;
};

function getStarterTrackHref(track: StarterTrack) {
  return getDiscoverySeedPath({
    provider_id: track.provider_id,
    title: track.title,
    type: "track",
  });
}

function StarterRouteCard({
  track,
  priority,
}: {
  track: StarterTrack;
  priority: boolean;
}) {
  return (
    <PrefetchLink
      href={getStarterTrackHref(track)}
      className="group block overflow-hidden rounded-[0.9rem] bg-[var(--kocteau-surface-control)] outline-none transition-[opacity,transform] duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.985]"
      aria-label={`Start a discovery route from ${track.title} by ${track.artist_name ?? "Unknown artist"}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <EntityCoverImage
          src={track.cover_url}
          alt=""
          sizes="(max-width: 640px) 82vw, 19rem"
          quality={84}
          variant="card"
          priority={priority}
          className="absolute inset-0 h-full w-full"
          imageClassName="transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transition-none"
          iconClassName="size-8"
        />
        <div className="absolute inset-x-2 bottom-2 rounded-[0.68rem] bg-black/72 px-3 py-2.5 backdrop-blur-md">
          <p className="truncate font-pixel text-[12px] leading-tight text-white/94">
            {track.title}
          </p>
          <p className="mt-1 truncate text-[11px] leading-tight text-white/66">
            {track.artist_name ?? "Unknown artist"}
          </p>
        </div>
      </div>
    </PrefetchLink>
  );
}

export default function FeedStarterShelf({
  tracks,
  isAuthenticated,
  className,
}: FeedStarterShelfProps) {
  const trackedImpressionIdsRef = useRef(new Set<string>());
  const visibleTracks = useMemo(() => tracks.slice(0, 6), [tracks]);

  useEffect(() => {
    if (!isAuthenticated || visibleTracks.length === 0) {
      return;
    }

    visibleTracks.forEach((track, position) => {
      if (trackedImpressionIdsRef.current.has(track.id)) {
        return;
      }

      trackedImpressionIdsRef.current.add(track.id);
      trackAnalyticsEvent({
        eventType: "starter_impression",
        source: "feed:starter-mobile",
        metadata: {
          starter_track_id: track.id,
          provider_id: track.provider_id,
          matched_tag_count: track.matched_tag_count,
          position,
        },
      });
    });
  }, [isAuthenticated, visibleTracks]);

  if (visibleTracks.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("space-y-2.5 py-2", className)}
      aria-labelledby="feed-starter-route-title"
    >
      <SectionLinkHeading id="feed-starter-route-title" href="/search">
        Start a route
      </SectionLinkHeading>

      <TrackCarousel
        ariaLabel="Discovery starting points"
        compactControls
        contentClassName="gap-3"
        controlClassName="[--kocteau-carousel-cover-size:min(82vw,19rem)]"
        fadeClassName="kocteau-carousel-mask-r-from-tight"
        itemClassName="basis-[min(82vw,19rem)]"
        viewportClassName="-mr-3.5 pr-7"
      >
        {visibleTracks.map((track, index) => (
          <StarterRouteCard
            key={track.id}
            track={track}
            priority={index < 2}
          />
        ))}
      </TrackCarousel>
    </section>
  );
}
