"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  Compass,
  Disc3,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import { cn } from "@/lib/utils";

type AppSidebarProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

type AppSidebarProps = {
  profile: AppSidebarProfile | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: (pathname: string) => boolean;
};

function NavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const Icon = item.icon;
  const active = item.active(pathname);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex h-11 items-center justify-center rounded-2xl text-muted-foreground transition-all xl:justify-start xl:gap-3 xl:px-3",
        active
          ? "bg-muted text-foreground"
          : "hover:bg-muted/45 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="hidden text-sm font-medium xl:inline">{item.label}</span>
    </Link>
  );
}

export default function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      href: "/",
      label: "Feed",
      icon: Compass,
      active: (current) => current === "/",
    },
    {
      href: "/search",
      label: "Discover",
      icon: Search,
      active: (current) => current.startsWith("/search"),
    },
    {
      href: "/track",
      label: "Tracks",
      icon: Disc3,
      active: (current) => current.startsWith("/track"),
    },
  ];

  if (profile) {
    items.push(
      {
        href: "/saved",
        label: "Saved",
        icon: Bookmark,
        active: (current) => current.startsWith("/saved"),
      },
      {
        href: "/notifications",
        label: "Activity",
        icon: Bell,
        active: (current) => current.startsWith("/notifications"),
      },
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden border-r border-border/35 bg-background/90 backdrop-blur-xl md:flex md:w-20 xl:w-56">
      <div className="flex h-full w-full flex-col px-3 py-4">
        <div className="flex h-12 items-center justify-center xl:justify-start xl:px-2">
          <Link href="/" className="inline-flex items-center transition-opacity hover:opacity-80">
            <BrandLogo priority iconClassName="h-6 w-6" />
          </Link>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-border/30 pt-3">
          {profile ? (
            <>
              <Link
                href={`/u/${profile.username}`}
                className={cn(
                  "group flex h-11 items-center justify-center rounded-2xl text-muted-foreground transition-all xl:justify-start xl:gap-3 xl:px-3",
                  pathname.startsWith(`/u/${profile.username}`)
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted/45 hover:text-foreground",
                )}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {(profile.display_name ?? profile.username).slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden min-w-0 xl:block">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profile.display_name ?? `@${profile.username}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{profile.username}
                  </p>
                </div>
              </Link>

              <ProfileSettingsDialog
                profile={profile}
                trigger={
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center rounded-2xl text-muted-foreground transition-all hover:bg-muted/45 hover:text-foreground xl:justify-start xl:gap-3 xl:px-3"
                  >
                    <Settings2 className="size-4 shrink-0" />
                    <span className="hidden text-sm font-medium xl:inline">Settings</span>
                  </button>
                }
              />
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-2xl text-muted-foreground transition-all hover:bg-muted/45 hover:text-foreground xl:justify-start xl:gap-3 xl:px-3"
            >
              <UserRound className="size-4 shrink-0" />
              <span className="hidden text-sm font-medium xl:inline">Join</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
