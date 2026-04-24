"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
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
  const prefersReducedMotion = useReducedMotion();
  const { data, isLoading } = useQuery({
    ...activeProfilesQueryOptions(4),
    enabled: isDesktop,
  });
  const profiles = data?.profiles ?? [];

  if (!isDesktop) {
    return null;
  }

  return (
    <aside className="hidden lg:block" aria-label="Fresh voices">
      <div className="sticky top-1 space-y-2.5 pt-1">
        <p className="px-1 font-editorial text-[1.45rem] font-normal leading-none text-muted-foreground/76">
          Fresh voices
        </p>

        {isLoading ? (
          <WhoToFollowRailSkeleton showHeading={false} />
        ) : profiles.length > 0 ? (
          <div className="space-y-0.5">
            {profiles.map((profile, index) => {
              const primaryLabel = profile.display_name ?? `@${profile.username}`;

              return (
                <motion.div
                  key={profile.id}
                  className="rounded-[0.85rem] px-2.5 py-2.5 transition-colors hover:bg-card/16"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.16,
                          ease: "easeOut",
                          delay: Math.min(index * 0.02, 0.06),
                        }
                  }
                >
                  <div className="flex items-start gap-3">
                    <PrefetchLink
                      href={`/u/${profile.username}`}
                      className="group min-w-0 flex-1 rounded-[1rem] transition-colors hover:text-foreground"
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          avatarUrl={profile.avatar_url}
                          displayName={profile.display_name}
                          username={profile.username}
                          className="size-10 shrink-0 ring-1 ring-white/[0.05]"
                          sizes="40px"
                          initialsLength={2}
                        />

                        <div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
                          <p className="truncate text-[14px] font-medium text-foreground">
                            {primaryLabel}
                          </p>
                          <p className="truncate text-[12.5px] text-muted-foreground/82">
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
                        className="h-7 shrink-0 px-2.5 text-[10px] !border-border/18 !bg-transparent !text-foreground/90 hover:!bg-card/22 hover:!text-foreground"
                      />
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="px-3 text-sm text-muted-foreground">
            No fresh voices yet.
          </div>
        )}
      </div>
    </aside>
  );
}
