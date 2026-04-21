"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FollowProfileButton from "@/components/follow-profile-button";
import { WhoToFollowRailSkeleton } from "@/components/feed-loading-skeletons";
import PrefetchLink from "@/components/prefetch-link";
import UserAvatar from "@/components/user-avatar";
import { activeProfilesQueryOptions } from "@/queries/profiles";

type WhoToFollowRailProps = {
  isAuthenticated: boolean;
};

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

export default function WhoToFollowRail({
  isAuthenticated,
}: WhoToFollowRailProps) {
  const isDesktop = useDesktopRail();
  const { data, isLoading } = useQuery({
    ...activeProfilesQueryOptions(4),
    enabled: isDesktop,
  });
  const profiles = data?.profiles ?? [];

  if (!isDesktop) {
    return null;
  }

  return (
    <aside className="hidden space-y-3 lg:block">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        Who to follow
      </p>

      {isLoading ? (
        <WhoToFollowRailSkeleton showHeading={false} />
      ) : profiles.length > 0 ? (
        <div className="space-y-2">
          {profiles.map((profile) => {
            const primaryLabel = profile.display_name ?? `@${profile.username}`;

            return (
              <div
                key={profile.id}
                className="rounded-lg bg-card/44 p-3 ring-1 ring-white/[0.06]"
              >
                <div className="flex items-start gap-3">
                  <PrefetchLink
                    href={`/u/${profile.username}`}
                    className="group min-w-0 flex-1 rounded-lg transition-colors hover:text-foreground"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        avatarUrl={profile.avatar_url}
                        displayName={profile.display_name}
                        username={profile.username}
                        className="size-10 shrink-0"
                        sizes="40px"
                        initialsLength={2}
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-[14px] font-medium text-foreground">
                          {primaryLabel}
                        </p>
                        <p className="truncate text-[12.5px] text-muted-foreground">
                          @{profile.username}
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
                      className="shrink-0 px-2.5 text-[10px]"
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg bg-card/32 p-3 text-sm text-muted-foreground ring-1 ring-white/[0.05]">
          No suggestions yet.
        </div>
      )}
    </aside>
  );
}
