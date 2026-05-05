"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, Home, Plus, Search, UserRound } from "lucide-react";
import NewReviewDialog from "@/components/new-review-dialog";
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
  icon: React.ComponentType<{ className?: string }>;
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
        "group flex h-10.5 min-w-10.5 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-[transform,color,background-color,border-color,box-shadow] duration-150 ease-out active:scale-[0.96]",
        active
          ? "gap-1.5 border-foreground/10 bg-foreground/10 px-3 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "px-0 hover:border-foreground/10 hover:bg-foreground/7 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-[1.04rem] shrink-0", active && "text-foreground")} />
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

  const leftItems: NavItem[] = [
    {
      href: "/",
      label: "Feed",
      icon: Home,
      active: (current) => current === "/",
    },
    {
      href: "/search",
      label: "Explore",
      icon: Search,
      active: (current) => current.startsWith("/search") || current.startsWith("/track"),
    },
  ];

  const rightItems: NavItem[] = [
    ...(profile
      ? [
          {
            href: "/notifications",
            label: "Activity",
            icon: Bell,
            active: (current: string) => current.startsWith("/notifications"),
          },
          {
            href: `/u/${profile.username}`,
            label: "Profile",
            icon: UserRound,
            active: (current: string) => current.startsWith(`/u/${profile.username}`),
          },
        ]
      : [
          {
            href: "/saved",
            label: "Saved",
            icon: Bookmark,
            active: (current: string) => current.startsWith("/saved"),
          },
          {
            href: "/login",
            label: "Log in",
            icon: UserRound,
            active: (current: string) =>
              current.startsWith("/login") || current.startsWith("/signup"),
          },
        ]),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.85rem)] z-50 px-3 md:hidden">
      <div className="mx-auto flex max-w-[23rem] justify-center">
        <div className="mobile-liquid-bar flex items-center gap-0.5 rounded-full p-1">
          {leftItems.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} />
          ))}
          {rightItems.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} />
          ))}
          <span className="mx-1 h-7 w-px shrink-0 bg-foreground/10" aria-hidden="true" />
          <NewReviewDialog
            isAuthenticated={Boolean(profile)}
            trigger={
              <button
                type="button"
                aria-label="New review"
                className="flex size-10.5 items-center justify-center rounded-full border border-foreground/10 bg-foreground text-background shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-foreground/92 active:scale-[0.96]"
              >
                <Plus className="size-[1.15rem]" />
                <span className="sr-only">New review</span>
              </button>
            }
            triggerLabelClassName="sr-only"
          />
        </div>
      </div>
    </nav>
  );
}
