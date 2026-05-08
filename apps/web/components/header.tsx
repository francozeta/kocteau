"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink, MoreHorizontal, Share2 } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import NotificationsButton from "@/components/notifications-button";
import PrefetchLink from "@/components/prefetch-link";
import { useRouteHeader } from "@/components/route-header-context";
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
  const isSearchRoute = pathname.startsWith("/search");

  const standardHeaderTitle = (() => {
    if (isTrackDetailRoute) {
      return detailHeader?.shareLabel ?? "Track";
    }

    if (isProfileDetailRoute) {
      return detailHeader?.shareLabel ?? "Profile";
    }

    if (pathname === "/") {
      return "Feed";
    }

    if (isSearchRoute) {
      return "Explore";
    }

    if (pathname === "/track") {
      return "Tracks";
    }

    if (pathname.startsWith("/saved")) {
      return "Saved";
    }

    if (pathname.startsWith("/notifications")) {
      return "Activity";
    }

    if (pathname.startsWith("/review/")) {
      return "Review";
    }

    const [firstSegment] = pathname.split("/").filter(Boolean);

    if (!firstSegment) {
      return "Feed";
    }

    return firstSegment
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  })();

  function renderMobileLogoMark(label: string) {
    return (
      <PrefetchLink
        href="/"
        queryWarmup={{ kind: "feed" }}
        className="mobile-liquid-logo pointer-events-auto inline-flex size-11 items-center justify-center rounded-full"
        aria-label={`Go to feed. Current route: ${label}`}
      >
        <BrandLogo iconClassName="h-[1.35rem] w-[1.35rem] shrink-0" />
        <span className="sr-only">{label}</span>
      </PrefetchLink>
    );
  }

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
      "pointer-events-none fixed inset-x-0 top-0 z-30 px-3 pt-[calc(env(safe-area-inset-top)+0.55rem)] md:pointer-events-auto md:static md:inset-auto md:top-auto md:z-10 md:flex-none md:bg-transparent md:px-0 md:pt-0 md:backdrop-blur-none md:shadow-[inset_0_-1px_0_rgba(255,255,255,0.045)]",
      isMobileReviewRoute && "max-md:hidden",
      shouldUseContextualHeader && "max-md:hidden",
    )}>
      <div
        className="mobile-liquid-header pointer-events-none absolute left-1/2 top-0 h-[3.75rem] w-screen -translate-x-1/2 md:hidden"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-11 items-center justify-between gap-3 md:h-16 md:px-6">
        <div className="relative z-10 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={toggleSidebar}
            className="mobile-liquid-button pointer-events-auto size-10 rounded-full text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Toggle navigation"
          >
            <HamburgerIcon className="size-[1.15rem]" />
          </Button>
        </div>

        <div className="pointer-events-none absolute inset-x-14 z-10 flex min-w-0 justify-center md:hidden">
          {renderMobileLogoMark(standardHeaderTitle)}
        </div>

        <div className="pointer-events-none absolute inset-x-0 hidden justify-center md:flex">
          <div className="pointer-events-none inline-flex max-w-[22rem] items-center justify-center px-4">
            <span className="truncate text-sm font-medium text-foreground">
              {standardHeaderTitle}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          {profile ? (
            <NotificationsButton
              userId={profile.id}
              initialUnreadCount={initialUnreadCount}
              initialNotifications={initialNotifications}
              triggerClassName="mobile-liquid-button pointer-events-auto size-10 text-muted-foreground hover:text-foreground"
            />
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="mobile-liquid-button pointer-events-auto h-10 rounded-full px-4 text-foreground md:border-border/30"
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
        <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-3 pt-[calc(env(safe-area-inset-top)+0.55rem)] md:hidden">
          <div
            className="mobile-liquid-header pointer-events-none absolute left-1/2 top-0 h-[3.75rem] w-screen -translate-x-1/2"
            aria-hidden="true"
          />

          <div className="relative z-10 flex h-11 items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={handleDetailBack}
              className="mobile-liquid-button pointer-events-auto relative z-10 size-10 rounded-full text-foreground"
              aria-label="Go back"
            >
              <ChevronLeft className="size-[1.1rem]" />
            </Button>

            <div className="pointer-events-none absolute inset-x-16 z-10 flex min-w-0 justify-center">
              {renderMobileLogoMark(standardHeaderTitle)}
            </div>

            <div className="pointer-events-auto relative z-10 inline-flex items-center rounded-full">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="mobile-liquid-button size-10 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label={isProfileDetailRoute ? "Profile actions" : "Track actions"}
                  >
                    <MoreHorizontal className="size-[1.1rem]" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-2xl border-border/30 bg-popover/96 p-1.5 shadow-none backdrop-blur-md"
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
