"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import HeaderUserMenu from "@/components/header-user-menu";
import NewReviewDialog from "@/components/new-review-dialog";
import NotificationsButton from "@/components/notifications-button";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { NotificationItem } from "@/lib/notifications";

type HeaderProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

function getRouteLabel(pathname: string, username?: string | null) {
  if (pathname === "/") {
    return {
      eyebrow: "Listening room",
      title: "Feed",
    };
  }

  if (pathname.startsWith("/search")) {
    return {
      eyebrow: "Discovery",
      title: "Search",
    };
  }

  if (pathname.startsWith("/track")) {
    return {
      eyebrow: "Catalog",
      title: "Track pages",
    };
  }

  if (pathname.startsWith("/saved")) {
    return {
      eyebrow: "Library",
      title: "Saved reviews",
    };
  }

  if (pathname.startsWith("/notifications")) {
    return {
      eyebrow: "Activity",
      title: "Notifications",
    };
  }

  if (username && pathname.startsWith(`/u/${username}`)) {
    return {
      eyebrow: "Identity",
      title: "Profile",
    };
  }

  return {
    eyebrow: "Kocteau",
    title: "Music notes",
  };
}

export default function Header({
  profile,
  initialUnreadCount = 0,
  initialNotifications = [],
}: {
  profile: HeaderProfile | null;
  initialUnreadCount?: number;
  initialNotifications?: NotificationItem[];
}) {
  const pathname = usePathname();
  const route = getRouteLabel(pathname, profile?.username);

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/78 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:h-[4.25rem] sm:px-6">
        <SidebarTrigger className="rounded-full border border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground" />

        <Link
          href="/"
          className="inline-flex items-center md:hidden"
          aria-label="Go to feed"
        >
          <BrandLogo iconClassName="h-5 w-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {route.eyebrow}
          </p>
          <p className="truncate text-sm font-medium text-foreground/92">
            {route.title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {profile ? (
            <NotificationsButton
              userId={profile.id}
              initialUnreadCount={initialUnreadCount}
              initialNotifications={initialNotifications}
            />
          ) : null}
          <NewReviewDialog isAuthenticated={Boolean(profile)} />
          {profile ? (
            <HeaderUserMenu profile={profile} />
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="rounded-full px-4">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="rounded-full px-4">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
