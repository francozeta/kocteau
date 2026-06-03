"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import FollowProfileButton from "@/components/follow-profile-button";
import { WhoToFollowRailSkeleton } from "@/components/feed-loading-skeletons";
import NewReviewDialog from "@/components/new-review-dialog";
import PrefetchLink from "@/components/prefetch-link";
import TrackCarousel from "@/components/track-carousel";
import TrackTile from "@/components/track-tile";
import { useSecondaryRailContent } from "@/components/secondary-rail-context";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/user-avatar";
import { helpFooterLinks } from "@/lib/help";
import type { StarterTrack } from "@/lib/starter";
import { getStarterRailQueryPath } from "@/lib/starter/surface";
import { fetchJson } from "@/queries/http";
import { activeProfilesQueryOptions } from "@/queries/profiles";

type WhoToFollowRailProps = {
  isAuthenticated: boolean;
};

type StarterRailResponse = {
  tracks: StarterTrack[];
};

const stableStarterRailQueryPath = "/api/starter/rail?surface=app&context=global";

function useDesktopRail() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(query.matches);

    sync();
    query.addEventListener("change", sync);

    return () => {
      query.removeEventListener("change", sync);
    };
  }, []);

  return isDesktop;
}

function StarterPickReviewTrigger({
  track,
  isAuthenticated,
}: {
  track: StarterTrack;
  isAuthenticated: boolean;
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
      trigger={
        <button
          type="button"
          className="block w-full rounded-[0.72rem] text-left outline-none transition-[opacity,transform] hover:opacity-[0.88] focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
          aria-label={`Review ${track.title}`}
        >
          <TrackTile
            title={track.title}
            artistName={track.artist_name}
            coverUrl={track.cover_url}
            sizes="104px"
            coverClassName="rounded-[0.58rem]"
            titleClassName="text-[12px] leading-4"
            artistClassName="text-[11px] leading-4"
          />
        </button>
      }
    />
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

export default function WhoToFollowRail({ isAuthenticated }: WhoToFollowRailProps) {
  const isDesktop = useDesktopRail();
  const pathname = usePathname();
  const isStudioRoute = pathname?.startsWith("/studio") ?? false;
  const customRailContent = useSecondaryRailContent();
  const hasCustomRailContent = customRailContent !== null;
  const publicStarterRailQueryPath = useMemo(
    () => getStarterRailQueryPath(pathname),
    [pathname],
  );
  const starterRailQueryPath = isAuthenticated
    ? stableStarterRailQueryPath
    : publicStarterRailQueryPath;
  const { data, isLoading } = useQuery({
    ...activeProfilesQueryOptions(3),
    enabled: isDesktop && !isStudioRoute,
  });
  const { data: starterRail, isLoading: isStarterRailLoading } = useQuery({
    queryKey: [
      "starter",
      "rail",
      isAuthenticated ? "global" : starterRailQueryPath,
    ],
    queryFn: () => fetchJson<StarterRailResponse>(starterRailQueryPath),
    enabled: isDesktop && !isStudioRoute,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const profiles = data?.profiles ?? [];
  const visibleStarterTracks = (starterRail?.tracks ?? []).slice(0, 6);
  const showStarterRail =
    !hasCustomRailContent &&
    !isStudioRoute &&
    (isStarterRailLoading || visibleStarterTracks.length > 0);

  return (
    <aside
      className="hidden lg:block lg:min-h-0 lg:pt-3 lg:pb-6"
      aria-label="Editorial rail"
    >
      <div className="flex h-full min-h-0 flex-col">
        {hasCustomRailContent ? (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {customRailContent}
          </div>
        ) : !isStudioRoute ? (
          <section className="min-h-[11.25rem] space-y-3 overflow-hidden" aria-label="Writers to notice">
            <p className="px-1 text-[12px] font-medium leading-none text-muted-foreground/70">
              Writers to notice
            </p>

            {isLoading ? (
              <WhoToFollowRailSkeleton showHeading={false} />
            ) : profiles.length > 0 ? (
              <div>
                {profiles.map((profile) => {
                  const primaryLabel = profile.display_name ?? `@${profile.username}`;

                  return (
                    <div
                      key={profile.id}
                      className="kocteau-rail-row rounded-[0.62rem] px-1 py-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <PrefetchLink
                          href={`/u/${profile.username}`}
                          className="group min-w-0 flex-1 rounded-[0.7rem] transition-colors hover:text-foreground"
                        >
                          <div className="flex items-start gap-2.5">
                            <UserAvatar
                              avatarUrl={profile.avatar_url}
                              displayName={profile.display_name}
                              username={profile.username}
                              className="size-8 shrink-0 ring-1 ring-white/[0.05]"
                              sizes="32px"
                              initialsLength={2}
                            />

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="truncate text-[13px] font-medium text-foreground">
                                {primaryLabel}
                              </p>
                              <p className="truncate text-[12px] text-muted-foreground/78">
                                Reviewing lately
                              </p>
                            </div>
                          </div>
                        </PrefetchLink>

                        {isAuthenticated ? (
                          <FollowProfileButton
                            profileId={profile.id}
                            initialFollowing={profile.viewer_is_following}
                            isAuthenticated
                            size="xs"
                            className="h-7 shrink-0 rounded-md px-2 text-[10px] !border-transparent !bg-transparent !text-foreground/88 hover:!bg-foreground/[0.055] hover:!text-foreground"
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-1 py-3 text-[13px] text-muted-foreground/78">
                No writers to notice yet.
              </div>
            )}
          </section>
        ) : (
          <div className="min-h-0 flex-1" aria-hidden="true" />
        )}

        {showStarterRail ? (
          <section className="mt-6 min-h-[12.25rem] space-y-3" aria-label="Starter picks">
            <p className="px-1 text-[12px] font-medium leading-none text-muted-foreground/70">
              Starter picks
            </p>
            {isStarterRailLoading ? (
              <StarterRailSkeleton />
            ) : (
              <TrackCarousel
                ariaLabel="Starter picks"
                compactControls
                contentClassName="gap-3"
                controlClassName="[--kocteau-carousel-cover-size:6.35rem]"
                fadeClassName="kocteau-carousel-mask-r-from-tight"
                itemClassName="basis-[6.35rem]"
              >
                {visibleStarterTracks.map((track) => (
                  <StarterPickReviewTrigger
                    key={track.id}
                    track={track}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </TrackCarousel>
            )}
          </section>
        ) : null}

        <footer className="mt-5 px-1 pb-8 pt-1 text-[11px] leading-5 text-muted-foreground/52">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {helpFooterLinks.map((link) => (
              <PrefetchLink
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-muted-foreground"
              >
                {link.label}
              </PrefetchLink>
            ))}
          </div>
          <p>© 2026 Kocteau</p>
        </footer>
      </div>
    </aside>
  );
}
