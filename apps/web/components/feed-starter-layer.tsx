"use client";

import { useMemo, useState } from "react";
import { ArrowRight, PenLine, Sparkles, X } from "lucide-react";
import EntityCoverImage from "@/components/entity-cover-image";
import NewReviewDialog from "@/components/new-review-dialog";
import { Button } from "@/components/ui/button";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { StarterTrack } from "@/lib/starter";

type FeedStarterLayerProps = {
  tracks: StarterTrack[];
  isAuthenticated: boolean;
};

function getStarterPrompt(track: StarterTrack) {
  if (track.prompt) {
    return track.prompt;
  }

  if (track.collection_title) {
    return `From ${track.collection_title}`;
  }

  return track.matched_tag_count > 0 ? "Matched to your taste tags" : "Picked by Kocteau";
}

export default function FeedStarterLayer({
  tracks,
  isAuthenticated,
}: FeedStarterLayerProps) {
  const [passedTrackIds, setPassedTrackIds] = useState<Set<string>>(() => new Set());
  const visibleTracks = useMemo(
    () => tracks.filter((track) => !passedTrackIds.has(track.id)),
    [passedTrackIds, tracks],
  );
  const activeTrack = visibleTracks[0] ?? null;
  const upcomingTracks = visibleTracks.slice(1, 4);

  if (tracks.length === 0) {
    return null;
  }

  function handlePass(track: StarterTrack) {
    setPassedTrackIds((current) => new Set(current).add(track.id));

    if (!isAuthenticated) {
      return;
    }

    trackAnalyticsEvent({
      eventType: "for_you_recommendation_action",
      source: "feed:starter",
      metadata: {
        action: "starter_pass",
        starter_track_id: track.id,
        provider_id: track.provider_id,
        matched_tag_count: track.matched_tag_count,
      },
    });
  }

  if (!activeTrack) {
    return (
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3 px-0.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5" />
              Starter picks
            </div>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              Queue cleared
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 border-border/42 bg-card/32 text-xs"
            onClick={() => setPassedTrackIds(new Set())}
          >
            Reset
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" />
            Starter picks
          </div>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Start your taste graph
          </h2>
        </div>
        <p className="hidden max-w-48 text-right text-xs leading-5 text-muted-foreground sm:block">
          Editorial prompts for your first reviews.
        </p>
      </div>

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <article className="grid min-h-[10rem] gap-3 rounded-md border border-border/32 bg-background/36 p-2.5 transition-colors hover:border-border/52 hover:bg-background/52 sm:grid-cols-[7rem_minmax(0,1fr)]">
          <EntityCoverImage
            src={activeTrack.cover_url}
            alt={`${activeTrack.title} cover`}
            sizes="112px"
            className="aspect-square w-full rounded-md border border-border/24 bg-muted/20 sm:size-28"
            iconClassName="size-6"
          />

          <div className="flex min-w-0 flex-col justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-medium uppercase text-muted-foreground">
                <Sparkles className="size-3" />
                Taste queue
              </div>
              <h3 className="line-clamp-2 font-serif text-2xl font-semibold leading-tight text-foreground">
                {activeTrack.title}
              </h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {activeTrack.artist_name ?? "Unknown artist"}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground/88">
                {getStarterPrompt(activeTrack)}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {visibleTracks.length} left
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full border border-border/28 bg-card/18 px-3"
                  onClick={() => handlePass(activeTrack)}
                >
                  <X className="size-3" />
                  Not now
                </Button>
                <NewReviewDialog
                  isAuthenticated={isAuthenticated}
                  initialSelection={{
                    provider: "deezer",
                    provider_id: activeTrack.provider_id,
                    type: "track",
                    title: activeTrack.title,
                    artist_name: activeTrack.artist_name,
                    cover_url: activeTrack.cover_url,
                    deezer_url: activeTrack.deezer_url,
                    entity_id: null,
                  }}
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-full border-border/42 bg-card/32 px-3 text-xs"
                      onClick={() => {
                        trackAnalyticsEvent({
                          eventType: "for_you_review_action",
                          source: "feed:starter",
                          metadata: {
                            action: "starter_review_cta",
                            starter_track_id: activeTrack.id,
                            provider_id: activeTrack.provider_id,
                          },
                        });
                      }}
                    >
                      <PenLine className="size-3" />
                      Review
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </article>

        {upcomingTracks.length > 0 ? (
          <div className="hidden min-w-0 flex-col gap-2 lg:flex">
            {upcomingTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                className="grid min-h-[4.75rem] grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border/24 bg-card/18 p-2 text-left transition hover:border-border/45 hover:bg-card/30"
                onClick={() => handlePass(activeTrack)}
              >
                <EntityCoverImage
                  src={track.cover_url}
                  alt={`${track.title} cover`}
                  sizes="52px"
                  className="size-[3.25rem] rounded-md border border-border/20 bg-muted/20"
                  iconClassName="size-4"
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-foreground">
                    {track.title}
                  </span>
                  <span className="block truncate text-[0.68rem] text-muted-foreground">
                    {track.artist_name ?? "Unknown artist"}
                  </span>
                </span>
                <ArrowRight className="size-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
