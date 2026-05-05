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
        "group flex size-10.5 items-center justify-center rounded-full text-muted-foreground transition-[transform,color,background-color] duration-150 ease-out active:scale-[0.96]",
        active
          ? "bg-foreground/10 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]"
          : "hover:bg-foreground/6 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-[1.08rem]", active && "text-foreground")} />
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
      <div className="mx-auto max-w-[22rem]">
        <div className="mobile-liquid-bar grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-center gap-1.5 rounded-[1.7rem] px-2 py-2">
          {leftItems.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} />
          ))}
          {rightItems.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} />
          ))}
          <NewReviewDialog
            isAuthenticated={Boolean(profile)}
            trigger={
              <button
                type="button"
                aria-label="New review"
                className="flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-[0_10px_26px_rgba(0,0,0,0.28)] transition-[transform,background-color] duration-150 ease-out hover:bg-foreground/92 active:scale-[0.96]"
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
