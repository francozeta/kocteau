"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import NotificationsButton from "@/components/notifications-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
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

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={cn("size-5 shrink-0", className)}
      fill="none"
    >
      <path
        d="M1 2.75h14M1 7.75h9M1 12.75h11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-30 border-b border-border/25 bg-background/72 backdrop-blur-xl">
      <div className="relative flex h-15 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={toggleSidebar}
            className="rounded-full border border-border/35 bg-background/60 text-foreground shadow-none hover:bg-muted/45"
            aria-label="Toggle navigation"
          >
            <HamburgerIcon className="size-[1.15rem]" />
          </Button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center md:hidden">
          <Link
            href="/"
            className="pointer-events-auto inline-flex items-center rounded-full px-2 py-1"
            aria-label="Go to feed"
          >
            <BrandLogo iconClassName="h-[1.35rem] w-[1.35rem]" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {profile ? (
            <NotificationsButton
              userId={profile.id}
              initialUnreadCount={initialUnreadCount}
              initialNotifications={initialNotifications}
            />
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-border/30 px-4 text-foreground"
              >
                Log in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
