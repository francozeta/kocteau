"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Icon, MagnifyingGlassIcon } from "@/components/ui/icons";
import {
  KocteauActivityIcon,
  KocteauHomeIcon,
  KocteauProfileIcon,
} from "@/components/kocteau-icons";
import NewReviewDialog from "@/components/new-review-dialog";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
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
      className={cn(
        "group flex h-10.5 min-w-10.5 items-center justify-center rounded-full border border-transparent text-muted-foreground/70 transition-[transform,color,background-color,border-color,box-shadow] duration-150 ease-out active:scale-[0.96]",
        active
          ? "gap-1.5 border-foreground/10 bg-foreground/10 px-3 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "px-0 hover:border-foreground/10 hover:bg-foreground/7 hover:text-foreground/90",
      )}
    >
      <Icon
        className={cn("size-[1.04rem] shrink-0", active && "text-foreground")}
        weight={active ? "fill" : "regular"}
      />
      {active ? (
        <span aria-hidden="true" className="whitespace-nowrap text-[0.68rem] font-medium leading-none">
          {item.label}
        </span>
      ) : null}
      <span className="sr-only">{item.label}</span>
    </Link>
  );
}

export default function MobileBottomBar({ profile }: MobileBottomBarProps) {
  const pathname = usePathname();

  const primaryItems: NavItem[] = [
    {
      href: profile ? "/feed" : "/",
      label: "Feed",
      icon: KocteauHomeIcon,
      active: (current) => current === (profile ? "/feed" : "/"),
    },
    {
      href: "/search",
      label: "Explore",
      icon: MagnifyingGlassIcon,
      active: (current) => current.startsWith("/search") || current.startsWith("/track"),
    },
  ];

  const secondaryItems: NavItem[] = [
    ...(profile
      ? [
          {
            href: "/notifications",
            label: "Activity",
            icon: KocteauActivityIcon,
            active: (current: string) => current.startsWith("/notifications"),
          },
          {
            href: `/u/${profile.username}`,
            label: "Profile",
            icon: KocteauProfileIcon,
            active: (current: string) => current.startsWith(`/u/${profile.username}`),
          },
        ]
      : [
          {
            href: "/login",
            label: "Log in",
            icon: KocteauProfileIcon,
            active: (current: string) =>
              current.startsWith("/login") || current.startsWith("/signup"),
          },
        ]),
  ];
  const navItems = [...primaryItems, ...secondaryItems];
  const reviewEntryLabel = profile ? "New review" : "Find a track";

  return (
    <nav className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.85rem)] z-50 px-3 md:hidden">
      <div
        className="mobile-liquid-footer pointer-events-none absolute bottom-[-0.85rem] left-1/2 h-[5.25rem] w-screen -translate-x-1/2"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[24rem] justify-center">
        <div
          className={cn(
            "mobile-liquid-bar grid w-full items-center justify-between rounded-full p-1",
            profile
              ? "grid-cols-[auto_auto_auto_auto_1px_auto]"
              : "grid-cols-[auto_auto_auto_1px_auto]",
          )}
        >
          {navItems.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} />
          ))}
          <span className="mx-1 h-7 w-px shrink-0 bg-foreground/10" aria-hidden="true" />
          <NewReviewDialog
            isAuthenticated={Boolean(profile)}
            intent="review"
            trigger={
              <button
                type="button"
                aria-label={reviewEntryLabel}
                className="flex size-10 items-center justify-center rounded-full border border-foreground bg-foreground text-background shadow-[0_10px_28px_rgba(0,0,0,0.32)] transition-[transform,background-color,border-color,color] duration-150 ease-out hover:border-foreground/90 hover:bg-foreground/90 hover:text-background active:scale-[0.96]"
              >
                <ReviewGlyphIcon className="size-[1.05rem]" />
                <span className="sr-only">{reviewEntryLabel}</span>
              </button>
            }
            triggerLabelClassName="sr-only"
          />
        </div>
      </div>
    </nav>
  );
}
