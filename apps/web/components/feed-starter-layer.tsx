"use client";

import { PenLine, Sparkles } from "lucide-react";
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
  if (tracks.length === 0) {
    return null;
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

      <div className="grid gap-2 sm:grid-cols-2">
        {tracks.map((track) => (
          <article
            key={track.id}
            className="grid min-h-[5.5rem] grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-md border border-border/32 bg-background/36 p-2.5 transition-colors hover:border-border/52 hover:bg-background/52"
          >
            <EntityCoverImage
              src={track.cover_url}
              alt={`${track.title} cover`}
              sizes="64px"
              className="size-16 rounded-md border border-border/24 bg-muted/20"
              iconClassName="size-5"
            />

            <div className="flex min-w-0 flex-col justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-foreground">
                  {track.title}
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  {track.artist_name ?? "Unknown artist"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground/86">
                  {getStarterPrompt(track)}
                </p>
              </div>

              <div className="flex items-center justify-end">
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
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 border-border/42 bg-card/32 px-2.5 text-xs"
                      onClick={() => {
                        trackAnalyticsEvent({
                          eventType: "for_you_review_action",
                          source: "feed:starter",
                          metadata: {
                            action: "starter_review_cta",
                            starter_track_id: track.id,
                            provider_id: track.provider_id,
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
          </article>
        ))}
      </div>
    </section>
  );
}
