"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Icon, MagnifyingGlassIcon } from "@/components/ui/icons";
import {
  KocteauHomeIcon,
  KocteauLibraryIcon,
  KocteauProfileIcon,
} from "@/components/kocteau-icons";
import NewReviewDialog from "@/components/new-review-dialog";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import UserAvatar from "@/components/user-avatar";
import { cn } from "@/lib/utils";

type MobileBottomBarProps = {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    spotify_url: string | null;
    apple_music_url: string | null;
    deezer_url: string | null;
  } | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: Icon;
  active: (pathname: string) => boolean;
};

function NavTab({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = item.active(pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-11 min-w-11 items-center justify-center rounded-full text-foreground/48 transition-[transform,color] duration-150 ease-out hover:text-foreground/80 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
        active
          ? "gap-1.5 px-3 text-foreground/96"
          : "",
      )}
    >
      {active ? <span aria-hidden="true" className="absolute inset-0 rounded-full bg-white/[0.14]" /> : null}
      <span className="relative z-[1] flex items-center gap-1.5">
        <Icon
          className={cn("size-[1.04rem] shrink-0", active && "text-foreground")}
          weight={active ? "fill" : "regular"}
        />
        {active ? (
          <span aria-hidden="true" className="whitespace-nowrap text-[12px] font-medium leading-none">
            {item.label}
          </span>
        ) : null}
      </span>
      <span className="sr-only">{item.label}</span>
    </Link>
  );
}

export default function MobileBottomBar({ profile }: MobileBottomBarProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/search")) {
    return (
      <nav
        aria-label="Search controls"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-[100001] w-[calc(100%-2rem)] -translate-x-1/2 md:hidden"
      >
        <div id="mobile-search-dock" />
      </nav>
    );
  }

  const navItems: NavItem[] = [
    {
      href: profile ? "/feed" : "/",
      label: "Home",
      icon: KocteauHomeIcon,
      active: (current) => current === (profile ? "/feed" : "/"),
    },
    {
      href: "/search",
      label: "Search",
      icon: MagnifyingGlassIcon,
      active: (current) => current.startsWith("/search") || current.startsWith("/track"),
    },
    {
      href: profile ? "/library" : "/login?next=%2Flibrary",
      label: "Library",
      icon: KocteauLibraryIcon,
      active: (current) => current.startsWith("/library") || current.startsWith("/saved"),
    },
  ];
  const profileHref = profile ? `/u/${profile.username}` : "/login";
  const isProfileActive = profile
    ? pathname.startsWith(`/u/${profile.username}`)
    : pathname.startsWith("/login") || pathname.startsWith("/signup");
  const reviewEntryLabel = profile ? "Review a track" : "Find a track to review";

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 -translate-x-1/2 md:hidden"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-white/[0.08] p-1 backdrop-blur-2xl backdrop-saturate-150">
          {navItems.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} />
          ))}

          <Link
            href={profileHref}
            aria-label={profile ? "Profile" : "Log in"}
            aria-current={isProfileActive ? "page" : undefined}
            className={cn(
              "relative flex h-11 min-w-11 items-center justify-center rounded-full text-foreground/48 transition-[transform,color] duration-150 hover:text-foreground/80 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
              isProfileActive && "gap-1.5 px-2.5 text-foreground/96",
            )}
          >
            {isProfileActive ? <span aria-hidden="true" className="absolute inset-0 rounded-full bg-white/[0.14]" /> : null}
            <span className="relative z-[1] flex items-center gap-1.5">
              {profile ? (
                <UserAvatar
                  avatarUrl={profile.avatar_url}
                  displayName={profile.display_name}
                  username={profile.username}
                  className="size-7"
                  sizes="28px"
                />
              ) : (
                <KocteauProfileIcon className="size-[1.04rem]" weight={isProfileActive ? "fill" : "regular"} />
              )}
              {isProfileActive ? (
                <span aria-hidden="true" className="whitespace-nowrap text-[12px] font-medium leading-none">
                  {profile ? "Profile" : "Log in"}
                </span>
              ) : null}
            </span>
          </Link>
        </div>

        <NewReviewDialog
          isAuthenticated={Boolean(profile)}
          intent="review"
          trigger={
            <button
              type="button"
              aria-label={reviewEntryLabel}
              className="flex size-11 items-center justify-center rounded-full bg-white/[0.08] text-foreground backdrop-blur-2xl backdrop-saturate-150 transition-[transform,background-color] duration-150 hover:bg-white/[0.12] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            >
              <ReviewGlyphIcon className="size-[1.12rem]" weight="fill" />
            </button>
          }
          triggerLabelClassName="sr-only"
        />
      </div>
    </nav>
  );
}
