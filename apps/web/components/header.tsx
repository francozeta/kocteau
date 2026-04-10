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
import { shareUrl } from "@/lib/share";
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
  const { detailHeader } = useRouteHeader();
  const isMobileReviewRoute = /^\/review\/[^/]+$/.test(pathname);
  const isTrackDetailRoute = /^\/track\/[^/]+$/.test(pathname);
  const isProfileDetailRoute = /^\/u\/[^/]+$/.test(pathname);
  const shouldUseContextualHeader = isTrackDetailRoute || isProfileDetailRoute;

  const handleDetailBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(isProfileDetailRoute ? "/" : "/search");
  }, [isProfileDetailRoute, router]);

  const handleShareDetail = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const detailKind = detailHeader?.kind ?? (isProfileDetailRoute ? "profile" : "track");
    const absoluteUrl = new URL(detailHeader?.sharePath ?? pathname, window.location.origin).toString();

    await shareUrl({
      title: detailHeader?.shareLabel ?? document.title,
      url: absoluteUrl,
      successMessage: detailKind === "profile" ? "Profile link copied" : "Track link copied",
      errorMessage:
        detailKind === "profile"
          ? "We couldn't share this profile right now."
          : "We couldn't share this track right now.",
    });
  }, [detailHeader, isProfileDetailRoute, pathname]);

  const standardHeader = (
    <header className={cn(
      "fixed inset-x-0 top-0 z-30 border-b border-border/25 bg-background/72 backdrop-blur-xl md:left-[var(--sidebar-width)] md:right-0 md:border md:border-border/20 md:bg-background/78 md:peer-data-[state=collapsed]:left-[var(--sidebar-width-icon)]",
      isMobileReviewRoute && "max-md:hidden",
      shouldUseContextualHeader && "max-md:hidden",
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

  if (shouldUseContextualHeader) {
    return (
      <>
        <header className="fixed inset-x-0 top-0 z-30 border-b border-border/25 bg-background/72 backdrop-blur-xl md:hidden">
          <div className="flex h-15 items-center justify-between gap-3 px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={handleDetailBack}
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
                    aria-label={isProfileDetailRoute ? "Profile actions" : "Track actions"}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-2xl border-border/30 bg-popover/96 p-1.5 shadow-xl"
                >
                  <DropdownMenuItem onSelect={() => void handleShareDetail()}>
                    <Share2 className="size-4" />
                    {isProfileDetailRoute ? "Share profile" : "Share track"}
                  </DropdownMenuItem>

                  {(detailHeader?.externalLinks ?? []).map((link) => (
                    <DropdownMenuItem
                      key={link.label}
                      onSelect={() => {
                        if (typeof window !== "undefined") {
                          window.open(link.url, "_blank", "noopener,noreferrer");
                        }
                      }}
                    >
                      <ExternalLink className="size-4" />
                      {link.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        {standardHeader}
      </>
    );
  }

  return standardHeader;
}
