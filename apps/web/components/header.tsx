"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink, MoreHorizontal, Search, Share2 } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import NotificationsButton from "@/components/notifications-button";
import PrefetchLink from "@/components/prefetch-link";
import { useRouteHeader } from "@/components/route-header-context";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toastActionError, toastActionSuccess } from "@/lib/feedback";
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
  const pathname = usePathname();
  const router = useRouter();
  const { trackHeader } = useRouteHeader();
  const isMobileReviewRoute = /^\/review\/[^/]+$/.test(pathname);
  const isTrackDetailRoute = /^\/track\/[^/]+$/.test(pathname);

  const handleTrackBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/search");
  }, [router]);

  const handleShareTrack = useCallback(async () => {
    try {
      if (typeof window === "undefined") {
        return;
      }

      const shareUrl = window.location.href;
      const shareLabel = trackHeader?.artistName?.trim()
        ? `${trackHeader.title} — ${trackHeader.artistName}`
        : trackHeader?.title ?? document.title;

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: shareLabel,
            text: shareLabel,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toastActionSuccess("Track link copied");
        return;
      }

      throw new Error("Sharing is unavailable on this device right now.");
    } catch (error) {
      toastActionError(error, "We couldn't share this track right now.");
    }
  }, [trackHeader]);

  const handleOpenDeezer = useCallback(() => {
    if (!trackHeader?.deezerUrl || typeof window === "undefined") {
      return;
    }

    window.open(trackHeader.deezerUrl, "_blank", "noopener,noreferrer");
  }, [trackHeader]);

  if (isTrackDetailRoute) {
    return (
      <>
        <header className="fixed inset-x-0 top-0 z-30 border-b border-border/25 bg-background/72 backdrop-blur-xl md:hidden">
          <div className="flex h-15 items-center justify-between gap-3 px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={handleTrackBack}
              className="size-10 rounded-full border border-border/32 bg-background/58 text-foreground shadow-none hover:bg-muted/30"
              aria-label="Go back"
            >
              <ChevronLeft className="size-[1.1rem]" />
            </Button>

            <div className="inline-flex items-center rounded-full border border-border/32 bg-background/58 p-1 shadow-none">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-muted-foreground hover:bg-muted/24 hover:text-foreground"
                    aria-label="Track actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-2xl border-border/30 bg-popover/96 p-1.5 shadow-xl"
                >
                  <DropdownMenuItem onSelect={() => void handleShareTrack()}>
                    <Share2 className="size-4" />
                    Share track
                  </DropdownMenuItem>

                  {trackHeader?.deezerUrl ? (
                    <DropdownMenuItem onSelect={handleOpenDeezer}>
                      <ExternalLink className="size-4" />
                      Open in Deezer
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <header className="fixed inset-x-0 top-0 z-30 hidden border-b border-border/25 bg-background/72 backdrop-blur-xl md:left-[var(--sidebar-width)] md:right-0 md:block md:border md:border-border/20 md:bg-background/78 md:peer-data-[state=collapsed]:left-[var(--sidebar-width-icon)]">
          <div className="relative hidden h-16 items-center justify-between gap-3 px-6 md:flex">
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={toggleSidebar}
                className="size-10 rounded-full border border-border/40 bg-background/65 text-muted-foreground shadow-none hover:bg-muted/40 hover:text-foreground md:hidden"
                aria-label="Toggle navigation"
              >
                <HamburgerIcon className="size-[1.15rem]" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/search" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-full border border-border/30 bg-background/55 px-3.5 text-muted-foreground hover:bg-muted/26 hover:text-foreground"
                >
                  <Search className="size-4" />
                  <span>Explore</span>
                  <Kbd className="ml-1 border-border/60 bg-muted/32 text-[0.62rem] text-muted-foreground">
                    F
                  </Kbd>
                </Button>
              </Link>
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
      </>
    );
  }

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-30 border-b border-border/25 bg-background/72 backdrop-blur-xl md:left-[var(--sidebar-width)] md:right-0 md:border md:border-border/20 md:bg-background/78 md:peer-data-[state=collapsed]:left-[var(--sidebar-width-icon)]",
      isMobileReviewRoute && "max-md:hidden",
    )}>
      <div className="relative flex h-15 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={toggleSidebar}
            className="size-10 rounded-full border border-border/40 bg-background/65 text-muted-foreground shadow-none hover:bg-muted/40 hover:text-foreground md:hidden"
            aria-label="Toggle navigation"
          >
            <HamburgerIcon className="size-[1.15rem]" />
          </Button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center md:hidden">
          <PrefetchLink
            href="/"
            queryWarmup={{ kind: "feed" }}
            className="pointer-events-auto inline-flex items-center rounded-full px-2 py-1"
            aria-label="Go to feed"
          >
            <BrandLogo iconClassName="h-[1.35rem] w-[1.35rem]" />
          </PrefetchLink>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/search" className="hidden md:block">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-full border border-border/30 bg-background/55 px-3.5 text-muted-foreground hover:bg-muted/26 hover:text-foreground"
            >
              <Search className="size-4" />
              <span>Explore</span>
              <Kbd className="ml-1 border-border/60 bg-muted/32 text-[0.62rem] text-muted-foreground">
                F
              </Kbd>
            </Button>
          </Link>
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
