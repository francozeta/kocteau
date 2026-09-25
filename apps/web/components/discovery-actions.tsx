"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KocteauShareIcon } from "@/components/kocteau-icons";
import { Check, Plus } from "@/components/ui/icons";
import PrefetchLink from "@/components/prefetch-link";
import { Spinner } from "@/components/ui/spinner";
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
import { fetchJson } from "@/queries/http";
import { cn } from "@/lib/utils";

const secondaryActionClassName =
  "flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[color,transform] duration-150 hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

const primaryActionClassName =
  "group flex h-10 min-w-20 items-center justify-center rounded-full text-xs font-medium text-background transition-transform duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black";

const mobileActionClassName =
  "group flex min-h-11 min-w-0 flex-1 items-center rounded-full text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default";
const mobileActionSurfaceClassName =
  "flex min-h-9 w-full items-center justify-center rounded-full px-3 py-2 leading-5 transition-colors duration-150";

export default function DiscoveryActions({
  seed,
  href,
  viewerId,
  mobile = false,
}: {
  seed: DiscoverySeed;
  href: string;
  viewerId: string | null;
  mobile?: boolean;
}) {
  const queryClient = useQueryClient();
  const savedKey = ["discovery-library", viewerId, seed.provider_id] as const;
  const savedState = useQuery({
    queryKey: savedKey,
    queryFn: () =>
      fetchJson<{ saved: boolean }>(
        `/api/entities/library?providerId=${encodeURIComponent(seed.provider_id)}`,
      ),
    enabled: Boolean(viewerId) && seed.type === "track",
    staleTime: 60_000,
  });
  const save = useMutation({
    mutationFn: mutateEntityLibraryItem,
    onSuccess: (result) => {
      queryClient.setQueryData(savedKey, { saved: true });
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
  const cachedState = seed.entityId
    ? queryClient.getQueryData<EntityLibraryState>(
        entityLibraryKeys.state(seed.entityId),
      )?.library
    : false;
  const saved = save.isSuccess || (savedState.data?.saved ?? cachedState);
  const checkingSavedState = Boolean(viewerId) && savedState.isPending;
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
  const share = () =>
    void shareUrl({
      title:
        seed.type === "artist"
          ? seed.title
          : [seed.title, seed.artist_name].filter(Boolean).join(" — "),
      url: new URL(href, window.location.origin).toString(),
      successMessage: "Link copied",
      errorMessage: "We could not share this music. Try again.",
    });
  const saveSong = () => {
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
  };

  if (mobile) {
    return (
      <div
        role="group"
        aria-label={`Actions for ${seed.title}`}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        {seed.type === "track" ? (
          <>
            <button
              type="button"
              onClick={() => openTrackReviewComposer(selection)}
              className={mobileActionClassName}
            >
              <span
                className={`${mobileActionSurfaceClassName} bg-foreground text-background group-hover:bg-foreground/90`}
              >
                Review
              </span>
            </button>
            <button
              type="button"
              aria-label={
                save.isPending
                  ? "Saving to library"
                  : saved
                    ? "Saved to library"
                    : "Save to library"
              }
              disabled={save.isPending || checkingSavedState || Boolean(saved)}
              onClick={saveSong}
              className={mobileActionClassName}
            >
              <span
                className={`${mobileActionSurfaceClassName} bg-[var(--kocteau-surface-control)] text-foreground ring-1 ring-inset ring-white/[0.12] group-hover:bg-[var(--kocteau-surface-control-hover)]`}
              >
                {save.isPending ? "Saving…" : saved ? "Saved" : "Save"}
              </span>
            </button>
          </>
        ) : (
          <>
            <PrefetchLink href={href} className={mobileActionClassName}>
              <span
                className={`${mobileActionSurfaceClassName} bg-foreground text-background`}
              >
                Open {seed.type}
              </span>
            </PrefetchLink>
            <button
              type="button"
              onClick={share}
              className={mobileActionClassName}
            >
              <span
                className={`${mobileActionSurfaceClassName} bg-[var(--kocteau-surface-control)] text-foreground ring-1 ring-inset ring-white/[0.12]`}
              >
                Share
              </span>
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Actions for ${seed.title}`}
      className="flex min-w-0 items-center gap-2"
    >
      <div className="flex h-8 shrink-0 items-center rounded-full bg-[var(--kocteau-surface-control)] px-0.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.045)]">
        <button
          type="button"
          aria-label={`Share ${label}`}
          title={`Share ${label}`}
          className={secondaryActionClassName}
          onClick={share}
        >
          <KocteauShareIcon className="size-4" />
        </button>
        {seed.type === "track" ? (
          <button
            type="button"
            aria-label={
              save.isPending || checkingSavedState
                ? save.isPending ? "Saving to library" : "Checking library"
                : saved
                  ? "Saved to library"
                  : "Save to library"
            }
            title={saved ? "Saved to library" : "Save to library"}
            disabled={save.isPending || checkingSavedState || Boolean(saved)}
            className={secondaryActionClassName}
            onClick={saveSong}
          >
            {save.isPending || checkingSavedState ? (
              <Spinner className="size-4" />
            ) : (
              <span className="relative size-4" aria-hidden="true">
                <Plus
                  className={cn(
                    "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-150 ease-[var(--kocteau-ease)] motion-reduce:transition-none",
                    saved ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0",
                  )}
                />
                <Check
                  className={cn(
                    "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-150 ease-[var(--kocteau-ease)] motion-reduce:transition-none",
                    saved ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
                  )}
                />
              </span>
            )}
          </button>
        ) : null}
      </div>
      {seed.type === "track" ? (
        <button
          type="button"
          onClick={() => openTrackReviewComposer(selection)}
          className={primaryActionClassName}
        >
          <span className="flex h-8 min-w-20 items-center justify-center rounded-full bg-foreground px-3 transition-colors duration-150 group-hover:bg-foreground/90">Review</span>
        </button>
      ) : (
        <PrefetchLink href={href} className={primaryActionClassName}>
          <span className="flex h-8 min-w-20 items-center justify-center rounded-full bg-foreground px-3 transition-colors duration-150 group-hover:bg-foreground/90">Open {seed.type}</span>
        </PrefetchLink>
      )}
    </div>
  );
}
