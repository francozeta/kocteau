"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FollowProfileButton from "@/components/follow-profile-button";
import { WhoToFollowRailSkeleton } from "@/components/feed-loading-skeletons";
import PrefetchLink from "@/components/prefetch-link";
import UserAvatar from "@/components/user-avatar";
import { helpFooterLinks } from "@/lib/help";
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

  return (
    <aside className="hidden lg:block" aria-label="Writers to notice">
      <div className="sticky top-1 space-y-3 pt-1">
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

        <footer className="px-1 pt-2 text-[11px] leading-5 text-muted-foreground/52">
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
