"use client";

import { useEffect, useMemo, useRef } from "react";
import NewReviewDialog from "@/components/new-review-dialog";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import TrackCarousel from "@/components/track-carousel";
import TrackTile from "@/components/track-tile";
import { Sparkles } from "@/components/ui/icons";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { StarterTrack } from "@/lib/starter";
import { cn } from "@/lib/utils";

type FeedStarterShelfProps = {
  tracks: StarterTrack[];
  isAuthenticated: boolean;
  className?: string;
};

function StarterShelfTrigger({
  track,
  isAuthenticated,
  position,
}: {
  track: StarterTrack;
  isAuthenticated: boolean;
  position: number;
}) {
  return (
    <NewReviewDialog
      isAuthenticated={isAuthenticated}
      initialSelection={{
        provider: "deezer",
        provider_id: track.provider_id,
        type: "track",
        title: track.title,
        artist_name: track.artist_name,
        cover_url: track.cover_url,
        deezer_url: track.deezer_url,
        entity_id: null,
      }}
      onSuccess={() => {
        if (!isAuthenticated) {
          return;
        }

        trackAnalyticsEvent({
          eventType: "starter_review_published",
          source: "feed:starter-mobile",
          metadata: {
            action: "starter_review_published",
            starter_track_id: track.id,
            provider_id: track.provider_id,
            matched_tag_count: track.matched_tag_count,
            position,
          },
        });
      }}
      trigger={
        <button
          type="button"
          className="block w-full rounded-[0.78rem] text-left outline-none transition-[opacity,transform] hover:opacity-[0.88] focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
          aria-label={`Review ${track.title}`}
          onClick={() => {
            if (!isAuthenticated) {
              return;
            }

            trackAnalyticsEvent({
              eventType: "starter_review_cta",
              source: "feed:starter-mobile",
              metadata: {
                action: "starter_review_cta",
                starter_track_id: track.id,
                provider_id: track.provider_id,
                matched_tag_count: track.matched_tag_count,
                position,
              },
            });
          }}
        >
          <TrackTile
            title={track.title}
            artistName={track.artist_name}
            coverUrl={track.cover_url}
            sizes="132px"
            badge={<ReviewGlyphIcon className="size-3.5" />}
            coverClassName="rounded-[0.68rem]"
            titleClassName="text-[12px] leading-4"
            artistClassName="text-[11px] leading-4"
          />
        </button>
      }
    />
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
      className={cn(
        "space-y-3 border-y border-border/14 py-3.5",
        className,
      )}
      aria-label="Starter picks"
    >
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] font-medium leading-none text-muted-foreground/74">
            <Sparkles className="size-3.5" />
            Starter picks
          </div>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground/82">
            Find your next review.
          </p>
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/58">
          {visibleTracks.length} picks
        </span>
      </div>

      <TrackCarousel
        ariaLabel="Starter picks"
        compactControls
        contentClassName="gap-3"
        controlClassName="[--kocteau-carousel-cover-size:7.35rem]"
        fadeClassName="kocteau-carousel-mask-r-from-tight"
        itemClassName="basis-[7.35rem] sm:basis-[7.85rem]"
        viewportClassName="-mr-3 pr-3"
      >
        {visibleTracks.map((track, position) => (
          <StarterShelfTrigger
            key={track.id}
            track={track}
            isAuthenticated={isAuthenticated}
            position={position}
          />
        ))}
      </TrackCarousel>
    </section>
  );
}
