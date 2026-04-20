"use client";

import { ExternalLink, Share2 } from "lucide-react";
import EditReviewDialog from "@/components/edit-review-dialog";
import EntityCoverImage from "@/components/entity-cover-image";
import NewReviewDialog from "@/components/new-review-dialog";
import { Button } from "@/components/ui/button";
import { toastActionError, toastActionSuccess } from "@/lib/feedback";
import type { EntityTasteTag } from "@/lib/queries/entities";

type TrackPageHeroProps = {
  entity: {
    id?: string | null;
    provider_id: string;
    title: string;
    artist_name: string | null;
    cover_url: string | null;
    deezer_url: string | null;
  };
  tags?: EntityTasteTag[];
  isAuthenticated: boolean;
  sharePath?: string;
  viewerReview: {
    id: string;
    title: string | null;
    body: string | null;
    rating: number;
    is_pinned: boolean;
  } | null;
  shouldOpenViewerEditor?: boolean;
};

const primaryActionClassName =
  "inline-flex h-10 min-w-[10.5rem] items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/92 sm:h-11 sm:min-w-[11.5rem]";

const sideActionClassName =
  "size-10 rounded-full border border-border/28 bg-card/18 text-muted-foreground shadow-none hover:bg-card/30 hover:text-foreground sm:size-11";

export default function TrackPageHero({
  entity,
  tags = [],
  isAuthenticated,
  sharePath,
  viewerReview,
  shouldOpenViewerEditor = false,
}: TrackPageHeroProps) {
  const deezerLink = entity.deezer_url
    ? {
        label: "Deezer",
        url: entity.deezer_url,
      }
    : null;
  const visibleTags = tags.slice(0, 5);
  const remainingTagCount = Math.max(tags.length - visibleTags.length, 0);
  const createSelection = {
    provider: "deezer" as const,
    provider_id: entity.provider_id,
    type: "track" as const,
    title: entity.title,
    artist_name: entity.artist_name,
    cover_url: entity.cover_url,
    deezer_url: entity.deezer_url,
    entity_id: entity.id ?? null,
  };
  const editSelection = entity.id
    ? {
        ...createSelection,
        entity_id: entity.id,
      }
    : null;

  async function handleShareTrack() {
    try {
      if (typeof window === "undefined") {
        return;
      }

      const path = sharePath ?? (entity.id ? `/track/${entity.id}` : `/track/deezer/${entity.provider_id}`);
      const shareUrl = new URL(path, window.location.origin).toString();
      const shareLabel = entity.artist_name?.trim()
        ? `${entity.title} — ${entity.artist_name}`
        : entity.title;

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: shareLabel,
            text: shareLabel,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toastActionSuccess("Track link copied");
        return;
      }

      throw new Error("Sharing is unavailable on this device right now.");
    } catch (error) {
      toastActionError(error, "We couldn't share this track right now.");
    }
  }

  return (
    <section className="border-b border-border/32 pb-4 md:border-border/24 md:pb-5">
      <div className="grid gap-4 md:grid-cols-[10rem,minmax(0,1fr)] md:items-center lg:grid-cols-[11.5rem,minmax(0,1fr)] lg:gap-5">
        <EntityCoverImage
          src={entity.cover_url}
          alt={entity.title}
          sizes="(max-width: 767px) 176px, (max-width: 1279px) 160px, 184px"
          priority
          quality={75}
          className="mx-auto size-[min(56vw,11rem)] rounded-[1.25rem] border border-border/24 bg-muted/16 shadow-[0_12px_32px_rgba(0,0,0,0.24)] md:mx-0 md:size-[10rem] lg:size-[11.5rem]"
          iconClassName="size-10"
        />

        <div className="min-w-0 text-center md:text-left">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Track
          </p>
          <h1 className="mt-2.5 font-serif text-[1.95rem] font-semibold leading-none text-balance sm:text-[2.25rem] lg:text-[2.7rem]">
            {entity.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground text-pretty sm:text-[0.95rem]">
            {entity.artist_name ?? "Unknown artist"}
          </p>

          <div className="mt-4 grid grid-cols-[2.5rem_minmax(0,auto)_2.5rem] items-center justify-center gap-2.5 md:inline-grid md:grid-cols-[2.75rem_minmax(0,auto)_2.75rem] md:justify-start md:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void handleShareTrack()}
              className={sideActionClassName}
              aria-label="Share track"
            >
              <Share2 className="size-4" />
            </Button>

            {viewerReview && editSelection ? (
              <EditReviewDialog
                reviewId={viewerReview.id}
                defaultOpen={shouldOpenViewerEditor}
                dismissSearchParam="editReview"
                trigger={
                  <button type="button" className={primaryActionClassName}>
                    Edit review
                  </button>
                }
                initialSelection={editSelection}
                initialTitle={viewerReview.title ?? ""}
                initialBody={viewerReview.body ?? ""}
                initialRating={viewerReview.rating}
                initialPinned={Boolean(viewerReview.is_pinned)}
              />
            ) : (
              <NewReviewDialog
                isAuthenticated={isAuthenticated}
                initialQuery={[entity.title, entity.artist_name].filter(Boolean).join(" ")}
                initialSelection={createSelection}
                trigger={
                  <button type="button" className={primaryActionClassName}>
                    Create review
                  </button>
                }
                triggerLabelClassName="sr-only"
              />
            )}

            {deezerLink ? (
              <Button
                asChild
                type="button"
                variant="ghost"
                size="icon"
                className={sideActionClassName}
              >
                <a
                  href={deezerLink.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open in ${deezerLink.label}`}
                >
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : (
              <span className="size-11" aria-hidden="true" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-muted-foreground md:justify-start">
            <span className="rounded-full border border-border/24 bg-card/18 px-2.5 py-1">
              Notes
            </span>
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-border/24 bg-card/18 px-2.5 py-1 text-foreground/78"
                title={`Taste signal: ${tag.kind}`}
              >
                {tag.label}
              </span>
            ))}
            {remainingTagCount > 0 ? (
              <span className="rounded-full border border-border/24 bg-card/18 px-2.5 py-1">
                +{remainingTagCount}
              </span>
            ) : null}
            {deezerLink ? (
              <a
                href={deezerLink.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border/24 bg-card/18 px-2.5 py-1 transition hover:border-border/45 hover:bg-card/30 hover:text-foreground"
              >
                {deezerLink.label}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
