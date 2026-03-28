"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disc3, Home, Plus, Search, UserRound } from "lucide-react";
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
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1rem] px-1 py-2 text-[10px] font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("size-[1.05rem]", active && "text-foreground")} />
      <span className="truncate">{item.label}</span>
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
      label: "Search",
      icon: Search,
      active: (current) => current.startsWith("/search"),
    },
  ];

  const rightItems: NavItem[] = [
    {
      href: "/track",
      label: "Tracks",
      icon: Disc3,
      active: (current) => current.startsWith("/track"),
    },
    profile
      ? {
          href: `/u/${profile.username}`,
          label: "Profile",
          icon: UserRound,
          active: (current) => current.startsWith(`/u/${profile.username}`),
        }
      : {
          href: "/login",
          label: "Log in",
          icon: UserRound,
          active: (current) => current.startsWith("/login"),
        },
  ];

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 md:hidden">
      <div className="mx-auto flex max-w-md items-center rounded-[1.85rem] border border-border/25 bg-background/88 px-2 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="grid min-w-0 flex-1 grid-cols-2">
          {leftItems.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="px-1">
          <NewReviewDialog
            isAuthenticated={Boolean(profile)}
            triggerClassName="size-12 rounded-[1.2rem] bg-foreground px-0 text-background shadow-none hover:bg-foreground/92"
            triggerLabelClassName="sr-only"
          />
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2">
          {rightItems.map((item) => (
            <NavTab key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
}
