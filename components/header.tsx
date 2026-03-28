"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
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
    /* TODO: change to fixed */
    <header className="sticky top-0 z-30 border-b border-border/25 bg-background/72 backdrop-blur-xl">
      <div className="flex h-15 items-center gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 rounded-full border border-border/35 bg-background/60 hover:bg-muted/45" />
          <Link href="/" className="inline-flex items-center md:hidden" aria-label="Go to feed">
            <BrandLogo iconClassName="h-5 w-5" />
          </Link>
        </div>

        <div className="min-w-0 flex-1" />

        <div className="flex items-center gap-2">
          {profile ? (
            <NotificationsButton
              userId={profile.id}
              initialUnreadCount={initialUnreadCount}
              initialNotifications={initialNotifications}
            />
          ) : null}
          <div className="hidden md:block">
            <NewReviewDialog isAuthenticated={Boolean(profile)} />
          </div>
          {profile ? null : (
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
