"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import FollowProfileButton from "@/components/follow-profile-button";
import ProfileHeroAvatar from "@/components/profile-hero-avatar";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfilePageHeaderProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

type ProfilePageHeaderProps = {
  profile: ProfilePageHeaderProfile;
  totalReviews: number;
  memberSince: string;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isAuthenticated: boolean;
};

export default function ProfilePageHeader({
  profile,
  totalReviews,
  memberSince,
  isOwnProfile,
  isFollowing,
  isAuthenticated,
}: ProfilePageHeaderProps) {
  const [localProfile, setLocalProfile] = useState(profile);
  const name = localProfile.display_name ?? `@${localProfile.username}`;

  return (
    <section className="border-b border-border/34 pb-7 md:border-border/30">
      <div className="grid gap-5 lg:grid-cols-[7.5rem,minmax(0,1fr)] lg:items-end">
        <ProfileHeroAvatar
          avatarUrl={localProfile.avatar_url}
          displayName={localProfile.display_name}
          username={localProfile.username}
          className="h-24 w-24 border-border/28 sm:h-28 sm:w-28 md:border-border/20"
          fallbackClassName="text-3xl font-semibold"
          priority
        />

        <div className="min-w-0 space-y-3.5">
          <div className="space-y-1">
            <h1 className="font-serif text-[2.7rem] font-bold leading-none text-balance sm:text-[3.15rem]">
              {name}
            </h1>
            <p className="text-[15px] text-muted-foreground">@{localProfile.username}</p>
          </div>
          {localProfile.bio ? (
            <p className="max-w-2xl text-[15px] leading-relaxed text-foreground/85">
              {localProfile.bio}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <span>{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>Since {memberSince}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isOwnProfile ? (
              <FollowProfileButton
                profileId={localProfile.id}
                initialFollowing={isFollowing}
                isAuthenticated={isAuthenticated}
                size="sm"
                className="px-3.5"
              />
            ) : null}
            {localProfile.spotify_url || localProfile.apple_music_url || localProfile.deezer_url ? (
              <>
                {localProfile.spotify_url ? (
                  <a
                    href={localProfile.spotify_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/34 bg-card/14 md:border-border/25 md:bg-transparent")}
                  >
                    Spotify
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
                {localProfile.apple_music_url ? (
                  <a
                    href={localProfile.apple_music_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/34 bg-card/14 md:border-border/25 md:bg-transparent")}
                  >
                    Apple Music
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
                {localProfile.deezer_url ? (
                  <a
                    href={localProfile.deezer_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/34 bg-card/14 md:border-border/25 md:bg-transparent")}
                  >
                    Deezer
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </>
            ) : null}
            {isOwnProfile ? (
              <ProfileSettingsDialog
                profile={localProfile}
                onProfileUpdate={(updatedProfile) => {
                  setLocalProfile((current) => ({
                    ...current,
                    ...updatedProfile,
                  }));
                }}
                triggerLabel="Edit profile"
                triggerClassName={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/34 bg-card/14 md:border-border/25 md:bg-transparent")}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
