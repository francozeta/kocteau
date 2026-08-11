"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/icons";
import { openTrackReviewComposer } from "@/hooks/use-global-shortcuts";
import type { DiscoverySeed } from "@/lib/discovery/seed";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";

type DiscoverySeedActionsProps = {
  seed: DiscoverySeed | null;
};

const smoothOut = [0.22, 1, 0.36, 1] as const;

function getEntityHref(seed: DiscoverySeed) {
  return buildEntityCanonicalPath({
    id: seed.entityId,
    provider: "deezer",
    provider_id: seed.provider_id,
    type: seed.type,
    title: seed.title,
    artist_name: seed.artist_name,
  });
}

function getSupportingLabel(seed: DiscoverySeed) {
  if (seed.type === "artist") {
    return "Artist";
  }

  return seed.artist_name || (seed.type === "album" ? "Album" : "Unknown artist");
}

function getProviderHref(seed: DiscoverySeed) {
  return `https://www.deezer.com/${seed.type}/${seed.provider_id}`;
}

function getOpenLabel(seed: DiscoverySeed) {
  if (seed.type === "artist") return "Open artist";
  if (seed.type === "album") return "Open album";
  return "Open track";
}

export default function DiscoverySeedActions({ seed }: DiscoverySeedActionsProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-40 flex justify-center md:bottom-5 lg:justify-end lg:px-6">
      <AnimatePresence initial={false} mode="popLayout">
        {seed ? (
          <motion.div
            key={`${seed.type}:${seed.provider_id}`}
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, y: 12, filter: "blur(2px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -4, filter: "blur(2px)" }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.25,
              ease: smoothOut,
            }}
            className="mobile-liquid-bar pointer-events-auto flex w-full max-w-[28rem] items-center gap-1 rounded-full p-1 sm:w-auto sm:min-w-[23rem]"
            aria-live="polite"
          >
            <PrefetchLink
              href={getEntityHref(seed)}
              aria-label={`Open ${seed.title}`}
              className="group flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full px-1.5 text-left text-foreground outline-none transition-[opacity,transform] duration-150 ease-out hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/55 active:scale-[0.98]"
            >
              <EntityCoverImage
                src={seed.cover_url}
                alt=""
                sizes="40px"
                quality={72}
                variant="thumbnail"
                className={seed.type === "artist" ? "size-10 rounded-full" : "size-10 rounded-[0.55rem]"}
                iconClassName="size-3.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-pixel text-[10px] leading-tight text-foreground/92">
                  {seed.title}
                </span>
                <span className="mt-0.5 block truncate text-[9px] leading-tight text-muted-foreground/68">
                  {getSupportingLabel(seed)}
                </span>
              </span>
            </PrefetchLink>

            {seed.type === "track" ? (
              <Button
                type="button"
                aria-label={`Review ${seed.title}`}
                onClick={() =>
                  openTrackReviewComposer({
                    provider: "deezer",
                    provider_id: seed.provider_id,
                    type: "track",
                    title: seed.title,
                    artist_name: seed.artist_name,
                    cover_url: seed.cover_url,
                    deezer_url: `https://www.deezer.com/track/${seed.provider_id}`,
                    entity_id: seed.entityId,
                  })
                }
                variant="ghost"
                className="h-10 shrink-0 gap-1.5 rounded-full bg-foreground/10 px-3 text-[11px] text-foreground hover:bg-foreground/[0.16] active:scale-[0.96]"
              >
                <ReviewGlyphIcon className="size-4" weight="fill" />
                <span>Review</span>
              </Button>
            ) : null}

            <a
              href={getProviderHref(seed)}
              target="_blank"
              rel="noreferrer"
              aria-label={`${getOpenLabel(seed)} on Deezer`}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground/72 outline-none transition-[transform,color,background-color] duration-150 hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/55 active:scale-[0.96] sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <ExternalLink className="size-4" />
              <span className="hidden text-[11px] sm:inline">{getOpenLabel(seed)}</span>
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
