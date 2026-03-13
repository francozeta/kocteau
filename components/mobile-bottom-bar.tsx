"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cog, Disc3, Home, Search, UserRound } from "lucide-react";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import { cn } from "@/lib/utils";

type MobileBottomBarProps = {
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    spotify_url: string | null;
    apple_music_url: string | null;
    deezer_url: string | null;
  };
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: (pathname: string) => boolean;
};

export default function MobileBottomBar({ profile }: MobileBottomBarProps) {
  const pathname = usePathname();

  const items: NavItem[] = [
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
    {
      href: "/track",
      label: "Tracks",
      icon: Disc3,
      active: (current) => current.startsWith("/track"),
    },
    {
      href: `/u/${profile.username}`,
      label: "Profile",
      icon: UserRound,
      active: (current) => current.startsWith(`/u/${profile.username}`),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-5 px-2 py-2">
        {items.map((item) => {
          const active = item.active(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <ProfileSettingsDialog
          profile={profile}
          trigger={
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Cog className="size-4" />
              <span>Settings</span>
            </button>
          }
        />
      </div>
    </nav>
  );
}
