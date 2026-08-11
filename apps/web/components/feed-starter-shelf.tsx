"use client";

import { useEffect, useMemo, useRef } from "react";
import SectionLinkHeading from "@/components/section-link-heading";
import StarterRouteCard from "@/components/starter-route-card";
import TrackCarousel from "@/components/track-carousel";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { StarterTrack } from "@/lib/starter";
import { cn } from "@/lib/utils";

type FeedStarterShelfProps = {
  tracks: StarterTrack[];
  isAuthenticated: boolean;
  variant?: "editorial" | "personalized";
  className?: string;
};

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
