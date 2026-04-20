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
  const [reviewedTrackIds, setReviewedTrackIds] = useState<Set<string>>(() => new Set());
  const visibleTracks = useMemo(
    () =>
      tracks.filter(
        (track) => !passedTrackIds.has(track.id) && !reviewedTrackIds.has(track.id),
      ),
    [passedTrackIds, reviewedTrackIds, tracks],
  );
  const activeTrack = visibleTracks[0] ?? null;
  const upcomingTracks = visibleTracks.slice(1, 4);
  const completedCount = tracks.length - visibleTracks.length;

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

  function handleReviewPublished(track: StarterTrack) {
    setReviewedTrackIds((current) => new Set(current).add(track.id));

    if (!isAuthenticated) {
      return;
    }

    trackAnalyticsEvent({
      eventType: "for_you_recommendation_action",
      source: "feed:starter",
      metadata: {
        action: "starter_review_published",
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
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Kocteau cue
          </div>
          <h2 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground">
            Start your taste graph
          </h2>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          {tracks.map((track, index) => {
            const isCleared = index < completedCount;
            const isActive = track.id === activeTrack.id;

            return (
              <span
                key={track.id}
                className={
                  isActive
                    ? "h-1.5 w-7 rounded-full bg-foreground"
                    : isCleared
                      ? "h-1.5 w-3 rounded-full bg-foreground/34"
                      : "h-1.5 w-3 rounded-full bg-border"
                }
              />
            );
          })}
        </div>
      </div>

      <article className="overflow-hidden rounded-md border border-border/32 bg-card/24">
        <div className="grid gap-0 md:grid-cols-[9.5rem_minmax(0,1fr)] lg:grid-cols-[10.5rem_minmax(0,1fr)_13rem]">
          <div className="border-b border-border/24 p-3 md:border-r md:border-b-0">
            <EntityCoverImage
              src={activeTrack.cover_url}
              alt={`${activeTrack.title} cover`}
              sizes="168px"
              className="aspect-square w-full rounded-md border border-border/24 bg-muted/20"
              iconClassName="size-7"
            />
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-5 p-4">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="size-3" />
                Editorial starter
              </div>
              <h3 className="line-clamp-2 font-serif text-3xl font-semibold leading-none text-foreground">
                {activeTrack.title}
              </h3>
              <p className="mt-2 truncate text-sm text-muted-foreground">
                {activeTrack.artist_name ?? "Unknown artist"}
              </p>
              <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-6 text-muted-foreground/90">
                {getStarterPrompt(activeTrack)}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {visibleTracks.length} left
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full border border-border/28 bg-background/18 px-3"
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
                  onSuccess={() => handleReviewPublished(activeTrack)}
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-full border-border/42 bg-background/24 px-3 text-xs"
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

          {upcomingTracks.length > 0 ? (
            <div className="hidden min-w-0 border-l border-border/24 lg:block">
              <div className="border-b border-border/24 px-3 py-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Up next
              </div>
              <div className="divide-y divide-border/20">
                {upcomingTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    className="grid min-h-[4.75rem] w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2 p-2.5 text-left transition hover:bg-background/28"
                    onClick={() => handlePass(activeTrack)}
                  >
                    <EntityCoverImage
                      src={track.cover_url}
                      alt={`${track.title} cover`}
                      sizes="48px"
                      className="size-12 rounded-md border border-border/20 bg-muted/20"
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
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
