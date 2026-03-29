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
      aria-label={item.label}
      className={cn(
        "group flex size-10.5 items-center justify-center rounded-[1rem] border border-transparent text-muted-foreground transition-all duration-200",
        active
          ? "border-border/18 bg-muted/34 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          : "hover:bg-muted/16 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-[1.08rem]", active && "text-foreground")} />
      <span className="sr-only">{item.label}</span>
    </Link>
  );
}

export default function MobileBottomBar({ profile }: MobileBottomBarProps) {
  const pathname = usePathname();

  if (/^\/review\/[^/]+$/.test(pathname)) {
    return null;
  }

  const leftItems: NavItem[] = [
    {
      href: "/",
      label: "Feed",
      icon: Home,
      active: (current) => current === "/" || current.startsWith("/review/"),
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
          active: (current) => current.startsWith("/login") || current.startsWith("/signup"),
        },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 px-3 md:hidden">
      <div className="mx-auto max-w-[22rem]">
        <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-center gap-1.5 rounded-[1.7rem] border border-border/22 bg-background/88 px-2 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
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
                className="flex size-11 items-center justify-center rounded-[1.05rem] bg-foreground text-background shadow-none transition-transform duration-200 hover:bg-foreground/92 active:scale-[0.98]"
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
