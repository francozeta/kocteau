"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KocteauShareIcon,
  KocteauLibraryIcon,
} from "@/components/kocteau-icons";
import PrefetchLink from "@/components/prefetch-link";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import { openTrackReviewComposer } from "@/hooks/use-global-shortcuts";
import type { DiscoverySeed } from "@/lib/discovery/seed";
import {
  toastActionError,
  toastActionSuccess,
  toastAuthRequired,
} from "@/lib/feedback";
import { shareUrl } from "@/lib/share";
import {
  entityLibraryKeys,
  mutateEntityLibraryItem,
  setEntityLibraryState,
} from "@/queries/entity-library";
import type { EntityLibraryState } from "@/lib/library/entity-library";

const actionClassName =
  "flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

export default function DiscoveryActions({
  seed,
  href,
  viewerId,
}: {
  seed: DiscoverySeed;
  href: string;
  viewerId: string | null;
}) {
  const queryClient = useQueryClient();
  const savedKey = ["discovery-library", viewerId, seed.provider_id] as const;
  const save = useMutation({
    mutationFn: mutateEntityLibraryItem,
    onSuccess: (result) => {
      queryClient.setQueryData(savedKey, true);
      setEntityLibraryState(
        queryClient,
        result.entityId,
        result.itemType,
        result.active,
      );
      toastActionSuccess("Added to library");
    },
    onError: (error) =>
      toastActionError(error, "We could not save this song. Try again."),
  });
  const saved =
    save.isSuccess ||
    queryClient.getQueryData<boolean>(savedKey) ||
    (seed.entityId
      ? queryClient.getQueryData<EntityLibraryState>(
          entityLibraryKeys.state(seed.entityId),
        )?.library
      : false);
  const label = seed.type === "track" ? "song" : seed.type;
  const selection = {
    provider: "deezer" as const,
    provider_id: seed.provider_id,
    type: "track" as const,
    title: seed.title,
    artist_name: seed.artist_name,
    cover_url: seed.cover_url,
    deezer_url: `https://www.deezer.com/track/${seed.provider_id}`,
    entity_id: seed.entityId,
  };

  return (
    <div
      role="group"
      aria-label={`Actions for ${seed.title}`}
      className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-[var(--kocteau-surface-control)] px-1"
    >
      <button
        type="button"
        aria-label={`Share ${label}`}
        className={actionClassName}
        onClick={() =>
          void shareUrl({
            title:
              seed.type === "artist"
                ? seed.title
                : [seed.title, seed.artist_name].filter(Boolean).join(" — "),
            url: new URL(href, window.location.origin).toString(),
            successMessage: "Link copied",
            errorMessage: "We could not share this music. Try again.",
          })
        }
      >
        <KocteauShareIcon className="size-4" />
      </button>
      {seed.type === "track" ? (
        <>
          <button
            type="button"
            onClick={() => openTrackReviewComposer(selection)}
            className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ReviewGlyphIcon className="size-4 shrink-0" />
            Review track
          </button>
          <button
            type="button"
            aria-label={saved ? "Saved to library" : "Save to library"}
            disabled={save.isPending || Boolean(saved)}
            className={actionClassName}
            onClick={() => {
              if (!viewerId) {
                toastAuthRequired("library");
                return;
              }
              save.mutate({
                entity: { ...selection, id: seed.entityId },
                itemType: "library",
                active: true,
                source: "search:canvas",
              });
            }}
          >
            <KocteauLibraryIcon
              className="size-4"
              weight={saved ? "fill" : "regular"}
            />
          </button>
        </>
      ) : (
        <PrefetchLink
          href={href}
          className="flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open {seed.type}
        </PrefetchLink>
      )}
    </div>
  );
}
