"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PrefetchLink from "@/components/prefetch-link";
import TrackCarousel from "@/components/track-carousel";
import TrackTile from "@/components/track-tile";
import { useSecondaryRailContent } from "@/components/secondary-rail-context";
import { Skeleton } from "@/components/ui/skeleton";
import { helpFooterLinks } from "@/lib/help";
import type { StarterTrack } from "@/lib/starter";
import {
  getStarterRailQueryPath,
  getStarterSurfaceFromPathname,
} from "@/lib/starter/surface";
import { fetchJson } from "@/queries/http";

type EditorialDiscoveryRailProps = {
  isAuthenticated: boolean;
};

type StarterRailResponse = {
  tracks: StarterTrack[];
};

const starterRailDisplayLimit = 6;
const starterRailFetchLimit = 12;
const railFooterLinks = [
  ...helpFooterLinks,
  {
    href: "https://github.com/francozeta/kocteau",
    label: "GitHub",
  },
  {
    href: "https://discord.gg/FgrNjkPa8",
    label: "Discord",
  },
] as const;

function useDesktopRail() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(query.matches);

    sync();
    query.addEventListener("change", sync);

    return () => query.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

function withStarterRailLimit(path: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}limit=${starterRailFetchLimit}`;
}

function getAuthenticatedStarterRailQueryPath(pathname: string | null) {
  const surface = getStarterSurfaceFromPathname(pathname);
  const params = new URLSearchParams({
    surface,
    context: `${surface}:rail`,
    limit: String(starterRailFetchLimit),
  });

  return `/api/starter/rail?${params.toString()}`;
}

function hashStarterRailKey(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function rotateStarterTracks(
  tracks: StarterTrack[],
  contextKey: string,
  limit: number,
) {
  if (tracks.length <= limit) {
    return tracks.slice(0, limit);
  }

  const offset = hashStarterRailKey(contextKey) % tracks.length;
  const rotatedTracks = [...tracks.slice(offset), ...tracks.slice(0, offset)];

  return rotatedTracks.slice(0, limit);
}

function StarterTrackLink({ track }: { track: StarterTrack }) {
  return (
    <PrefetchLink
      href={`/track/deezer/${track.provider_id}`}
      className="group block rounded-[0.72rem] outline-none transition-[opacity,transform] duration-150 ease-out hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]"
      aria-label={`Open ${track.title} by ${track.artist_name}`}
    >
      <TrackTile
        title={track.title}
        artistName={track.artist_name}
        coverUrl={track.cover_url}
        sizes="104px"
        coverClassName="rounded-[0.58rem]"
        titleClassName="text-[12px] leading-4 group-hover:text-foreground"
        artistClassName="text-[11px] leading-4"
      />
    </PrefetchLink>
  );
}

function StarterRailSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`starter-rail-skeleton-${index}`} className="w-[6.35rem] shrink-0 space-y-2">
          <Skeleton className="aspect-square w-full rounded-[0.58rem] bg-muted-foreground/[0.1]" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-[88%] rounded-full bg-muted-foreground/[0.12]" />
            <Skeleton className="h-2.5 w-[64%] rounded-full bg-muted-foreground/[0.08]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EditorialDiscoveryRail({
  isAuthenticated,
}: EditorialDiscoveryRailProps) {
  const isDesktop = useDesktopRail();
  const pathname = usePathname();
  const customRailContent = useSecondaryRailContent();
  const publicStarterRailQueryPath = useMemo(
    () => withStarterRailLimit(getStarterRailQueryPath(pathname)),
    [pathname],
  );
  const authenticatedStarterRailQueryPath = useMemo(
    () => getAuthenticatedStarterRailQueryPath(pathname),
    [pathname],
  );
  const starterRailQueryPath = isAuthenticated
    ? authenticatedStarterRailQueryPath
    : publicStarterRailQueryPath;
  const { data: starterRail, isLoading } = useQuery({
    queryKey: ["starter", "rail", starterRailQueryPath],
    queryFn: () => fetchJson<StarterRailResponse>(starterRailQueryPath),
    enabled: isDesktop && customRailContent === null,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const visibleStarterTracks = useMemo(
    () =>
      rotateStarterTracks(
        starterRail?.tracks ?? [],
        starterRailQueryPath,
        starterRailDisplayLimit,
      ),
    [starterRail?.tracks, starterRailQueryPath],
  );

  return (
    <aside className="hidden lg:block lg:min-h-0" aria-label="Discovery rail">
      <div className="flex h-full min-h-0 flex-col">
        {customRailContent ? (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {customRailContent}
          </div>
        ) : (
          <>
            <section className="space-y-3.5" aria-labelledby="rail-in-rotation">
              <div className="flex items-end justify-between gap-3 px-1">
                <p
                  id="rail-in-rotation"
                  className="text-[12px] font-medium leading-none text-foreground/86"
                >
                  In rotation
                </p>
                <PrefetchLink
                  href="/search"
                  className="text-[11px] leading-none text-muted-foreground/62 transition-colors hover:text-foreground"
                >
                  Discover
                </PrefetchLink>
              </div>

              {isLoading ? (
                <StarterRailSkeleton />
              ) : visibleStarterTracks.length > 0 ? (
                <TrackCarousel
                  ariaLabel="Curated tracks in rotation"
                  compactControls
                  contentClassName="gap-3"
                  controlClassName="[--kocteau-carousel-cover-size:6.35rem]"
                  fadeClassName="kocteau-carousel-mask-r-from-tight"
                  itemClassName="basis-[6.35rem]"
                >
                  {visibleStarterTracks.map((track) => (
                    <StarterTrackLink key={track.id} track={track} />
                  ))}
                </TrackCarousel>
              ) : null}
            </section>

            <section className="mt-auto pt-8" aria-label="Explore the Atlas">
              <PrefetchLink
                href="/atlas"
                className="kocteau-rail-row group block rounded-[0.72rem] px-3 py-3.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[12px] font-medium text-foreground/88">Atlas</p>
                    <p className="text-[11px] leading-[1.55] text-muted-foreground/64 text-pretty">
                      Browse by scene, mood, and era.
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-[12px] text-muted-foreground/46 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-foreground/78"
                  >
                    →
                  </span>
                </div>
              </PrefetchLink>
            </section>
          </>
        )}

        <footer className="mt-4 px-1 pb-8 pt-1 text-[11px] leading-5 text-muted-foreground/52">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {railFooterLinks.map((link) => {
              const isExternal = link.href.startsWith("http");

              return (
                <PrefetchLink
                  key={link.href}
                  href={link.href}
                  prefetch={!isExternal}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="transition-colors hover:text-muted-foreground"
                >
                  {link.label}
                </PrefetchLink>
              );
            })}
          </div>
          <p>© 2026 Kocteau</p>
        </footer>
      </div>
    </aside>
  );
}
