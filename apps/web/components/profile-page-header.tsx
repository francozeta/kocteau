"use client";

import { useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { BsAppleMusic } from "react-icons/bs";
import { FaDeezer, FaSpotify } from "react-icons/fa";
import { ExternalLink } from "@/components/ui/icons";
import CreatorPerksCard from "@/components/creator-perks-card";
import FollowProfileButton from "@/components/follow-profile-button";
import ProfileHeroAvatar from "@/components/profile-hero-avatar";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import { useRouteHeader } from "@/components/route-header-context";
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
  creatorPerk?: {
    unlockedAt: string;
    v0ReferralUrl: string | null;
  } | null;
};

type ProfileExternalLink = {
  label: string;
  url: string;
  icon: IconType;
};

function OfficialProfileBadge({ label = "Official" }: { label?: string | null }) {
  return (
    <span
      aria-label={label ?? "Official"}
      title={label ?? "Official"}
      className="inline-flex size-4 shrink-0 items-center justify-center text-foreground"
    >
      <svg viewBox="0 0 22 22" aria-hidden="true" className="size-4 fill-current">
        <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
      </svg>
    </span>
  );
}

function getProfilePageHeaderStateKey(profile: ProfilePageHeaderProfile) {
  return [
    profile.id,
    profile.username,
    profile.display_name ?? "",
    profile.avatar_url ?? "",
    profile.bio ?? "",
    profile.spotify_url ?? "",
    profile.apple_music_url ?? "",
    profile.deezer_url ?? "",
    profile.is_official ? "official" : "",
    profile.official_label ?? "",
  ].join("|");
}

export default function ProfilePageHeader(props: ProfilePageHeaderProps) {
  return (
    <ProfilePageHeaderState
      key={getProfilePageHeaderStateKey(props.profile)}
      {...props}
    />
  );
}

function ProfilePageHeaderState({
  profile,
  totalReviews,
  memberSince,
  isOwnProfile,
  isFollowing,
  isAuthenticated,
  creatorPerk = null,
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
              icon: FaSpotify,
            }
          : null,
        localProfile.apple_music_url
          ? {
              label: "Apple Music",
              url: localProfile.apple_music_url,
              icon: BsAppleMusic,
            }
          : null,
        localProfile.deezer_url
          ? {
              label: "Deezer",
              url: localProfile.deezer_url,
              icon: FaDeezer,
            }
          : null,
      ].filter((link): link is ProfileExternalLink => Boolean(link)),
    [localProfile.apple_music_url, localProfile.deezer_url, localProfile.spotify_url],
  );

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
    "h-9 w-full rounded-[var(--kocteau-radius-control)] border-border/42 bg-[var(--kocteau-surface-control)] px-4 text-sm text-foreground shadow-[0_0_0_1px_var(--kocteau-line-soft)] hover:bg-[var(--kocteau-surface-control-hover)] hover:text-foreground md:border-border/34";
  const reviewLabel = totalReviews === 1 ? "review" : "reviews";
  const actionGridClassName = cn(
    "grid gap-2.5 sm:max-w-[30rem]",
    creatorPerk
      ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem]"
      : "grid-cols-2 sm:max-w-[28rem]",
  );

  return (
    <section className="pb-4 md:pb-5">
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
                  <OfficialProfileBadge label={localProfile.official_label} />
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
                <ProfileExternalLinkAnchor key={link.label} link={link} />
              ))}
            </div>
          ) : null}
        </div>

        <div className={actionGridClassName}>
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
              className="h-9 w-full justify-center rounded-[var(--kocteau-radius-control)] px-4 text-sm shadow-[0_0_0_1px_var(--kocteau-line-soft)]"
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

          {creatorPerk ? (
            <CreatorPerksCard
              unlockedAt={creatorPerk.unlockedAt}
              v0ReferralUrl={creatorPerk.v0ReferralUrl}
              canOpenReferral={isOwnProfile}
              isAuthenticated={isAuthenticated}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProfileExternalLinkAnchor({ link }: { link: ProfileExternalLink }) {
  const Icon = link.icon;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex min-h-7 items-center gap-1.5 rounded-full px-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <Icon className="size-3.5 shrink-0 text-foreground/68 transition-colors group-hover:text-foreground" />
      <span>{link.label}</span>
      <ExternalLink className="size-3 shrink-0 text-muted-foreground/62 transition-colors group-hover:text-foreground/76" />
    </a>
  );
}
