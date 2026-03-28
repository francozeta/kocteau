"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import HeaderUserMenu from "@/components/header-user-menu";
import NewReviewDialog from "@/components/new-review-dialog";
import NotificationsButton from "@/components/notifications-button";
import { Button } from "@/components/ui/button";
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

export default function Header({
  profile,
  initialUnreadCount = 0,
  initialNotifications = [],
}: {
  profile: HeaderProfile | null;
  initialUnreadCount?: number;
  initialNotifications?: NotificationItem[];
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/25 bg-background/72 backdrop-blur-xl">
      <div className="flex h-15 items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="inline-flex items-center md:hidden" aria-label="Go to feed">
          <BrandLogo iconClassName="h-5 w-5" />
        </Link>

        <div className="hidden min-w-0 flex-1 md:block" />

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
                <Button variant="ghost" size="sm" className="rounded-full px-4 text-muted-foreground hover:text-foreground">
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
