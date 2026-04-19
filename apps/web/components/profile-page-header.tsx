"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import FollowProfileButton from "@/components/follow-profile-button";
import ProfileHeroAvatar from "@/components/profile-hero-avatar";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import { useRouteHeader } from "@/components/route-header-context";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { shareUrl } from "@/lib/share";
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
  is_official?: boolean | null;
  official_label?: string | null;
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
  const { setDetailHeader } = useRouteHeader();
  const name = localProfile.display_name ?? `@${localProfile.username}`;
  const usernameLabel = `@${localProfile.username}`;
  const displayNameLabel = localProfile.display_name?.trim() ?? null;
  const showDisplayName = Boolean(
    displayNameLabel &&
      displayNameLabel.toLowerCase() !== localProfile.username.trim().toLowerCase(),
  );
  const shareLabel = localProfile.display_name
    ? `${localProfile.display_name} (@${localProfile.username})`
    : `@${localProfile.username}`;
  const externalLinks = useMemo(
    () =>
      [
        localProfile.spotify_url
          ? {
              label: "Spotify",
              url: localProfile.spotify_url,
            }
          : null,
        localProfile.apple_music_url
          ? {
              label: "Apple Music",
              url: localProfile.apple_music_url,
            }
          : null,
        localProfile.deezer_url
          ? {
              label: "Deezer",
              url: localProfile.deezer_url,
            }
          : null,
      ].filter((link): link is { label: string; url: string } => Boolean(link)),
    [localProfile.apple_music_url, localProfile.deezer_url, localProfile.spotify_url],
  );

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    setDetailHeader({
      kind: "profile",
      title: name,
      shareLabel,
      sharePath: `/u/${localProfile.username}`,
      externalLinks,
    });

    return () => {
      setDetailHeader(null);
    };
  }, [externalLinks, localProfile.username, name, setDetailHeader, shareLabel]);

  async function handleShareProfile() {
    if (typeof window === "undefined") {
      return;
    }

    const absoluteUrl = new URL(`/u/${localProfile.username}`, window.location.origin).toString();

    await shareUrl({
      title: shareLabel,
      url: absoluteUrl,
      successMessage: "Profile link copied",
      errorMessage: "We couldn't share this profile right now.",
    });
  }

  const actionButtonClassName =
    "h-9 w-full rounded-xl border-border/34 bg-card/16 px-4 text-sm md:border-border/25 md:bg-transparent";
  const reviewLabel = totalReviews === 1 ? "review" : "reviews";

  return (
    <section className="border-b border-border/34 pb-4 md:border-border/30 md:pb-5">
      <div className="space-y-4">
        <div className="flex items-start gap-4 md:gap-5">
          <ProfileHeroAvatar
            avatarUrl={localProfile.avatar_url}
            displayName={localProfile.display_name}
            username={localProfile.username}
            className="size-20 shrink-0 border-border/28 md:size-24 md:border-border/20"
            fallbackClassName="text-xl font-semibold md:text-2xl"
            priority
          />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-[1.3rem] font-semibold tracking-tight text-foreground sm:text-[1.45rem] md:text-[1.6rem]">
                  {usernameLabel}
                </h1>
                {localProfile.is_official ? (
                  <Badge
                    variant="outline"
                    className="h-5 border-foreground/18 bg-foreground/[0.045] text-[0.625rem] text-foreground/82"
                  >
                    {localProfile.official_label ?? "Official"}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] sm:text-sm">
                <div className="inline-flex items-baseline gap-1.5">
                  <span className="font-semibold text-foreground">{totalReviews}</span>
                  <span className="text-muted-foreground">{reviewLabel}</span>
                </div>

                <div className="inline-flex items-baseline gap-1.5">
                  <span className="font-semibold text-foreground">Joined</span>
                  <span className="text-muted-foreground">{memberSince}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {showDisplayName ? (
            <p className="text-sm font-medium text-foreground">{displayNameLabel}</p>
          ) : null}

          {localProfile.bio ? (
            <p className="max-w-2xl text-sm leading-6 text-foreground/82 text-pretty">
              {localProfile.bio}
            </p>
          ) : null}

          {externalLinks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
              {externalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  {link.label}
                  <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:max-w-[28rem]">
          {isOwnProfile ? (
            <ProfileSettingsDialog
              profile={localProfile}
              onProfileUpdate={(updatedProfile) => {
                setLocalProfile((current) => ({
                  ...current,
                  ...updatedProfile,
                }));
              }}
              trigger={
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "outline", size: "default" }), actionButtonClassName)}
                >
                  Edit profile
                </button>
              }
            />
          ) : (
            <FollowProfileButton
              profileId={localProfile.id}
              initialFollowing={isFollowing}
              isAuthenticated={isAuthenticated}
              size="default"
              className="h-9 w-full justify-center rounded-xl px-4 text-sm"
            />
          )}

          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => void handleShareProfile()}
            className={actionButtonClassName}
          >
            Share profile
          </Button>
        </div>
      </div>
    </section>
  );
}
