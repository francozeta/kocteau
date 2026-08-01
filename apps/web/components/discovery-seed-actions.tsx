"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import PrefetchLink from "@/components/prefetch-link";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import { Button } from "@/components/ui/button";
import { ExternalLink, Music2 } from "@/components/ui/icons";
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

export default function DiscoverySeedActions({ seed }: DiscoverySeedActionsProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-40 flex justify-center sm:bottom-5 lg:justify-end lg:px-6">
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
            className="mobile-liquid-bar pointer-events-auto flex w-full max-w-[24rem] items-center gap-1 rounded-full p-1 sm:w-auto sm:min-w-[18rem]"
            aria-live="polite"
          >
            <PrefetchLink
              href={getEntityHref(seed)}
              aria-label={`Open ${seed.title}`}
              className="group flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-foreground/10 bg-foreground/10 px-3 text-left text-foreground outline-none transition-[transform,background-color,border-color] duration-150 ease-out hover:border-foreground/14 hover:bg-foreground/[0.14] focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98]"
            >
              <Music2 className="size-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-pixel text-[10px] leading-tight text-foreground/92">
                  {seed.title}
                </span>
                <span className="mt-0.5 block truncate text-[9px] leading-tight text-muted-foreground/68">
                  {getSupportingLabel(seed)}
                </span>
              </span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground/62 transition-colors duration-150 group-hover:text-foreground/86" />
            </PrefetchLink>

            {seed.type === "track" ? (
              <Button
                type="button"
                size="icon-lg"
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
                className="size-10 shrink-0 rounded-full border-foreground shadow-[0_10px_28px_rgba(0,0,0,0.32)] active:scale-[0.96]"
              >
                <ReviewGlyphIcon className="size-[1.05rem]" />
                <span className="sr-only">Review</span>
              </Button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
