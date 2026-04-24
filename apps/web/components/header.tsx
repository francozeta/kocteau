"use client";

import { useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink, MessageSquare, MoreHorizontal, Search, Share2 } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import CommandIcon from "@/components/command-icon";
import NewReviewDialog from "@/components/new-review-dialog";
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

const FEEDBACK_URL = "https://github.com/francozeta/kocteau/issues/new";

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
  const prefersReducedMotion = useReducedMotion();

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

  function renderMobileRouteMark(label: string) {
    return (
      <PrefetchLink
        href="/"
        queryWarmup={{ kind: "feed" }}
        className="pointer-events-auto inline-flex min-w-0 max-w-[min(66vw,18rem)] items-center gap-2 rounded-full px-2 py-1"
        aria-label={`Go to feed. Current route: ${label}`}
      >
        <BrandLogo iconClassName="h-[1.25rem] w-[1.25rem] shrink-0" />
        <span className="shrink-0 text-sm font-medium text-muted-foreground/45">/</span>
        <span className="min-w-0 truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
          {label}
        </span>
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

  const handleGiveFeedback = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.open(FEEDBACK_URL, "_blank", "noopener,noreferrer");
  }, []);

  const standardHeader = (
    <header className={cn(
      "fixed inset-x-0 top-0 z-30 bg-background/72 backdrop-blur-xl md:static md:inset-auto md:top-auto md:z-10 md:flex-none md:bg-transparent md:backdrop-blur-none md:shadow-[inset_0_-1px_0_rgba(255,255,255,0.045)]",
      isMobileReviewRoute && "max-md:hidden",
      shouldUseContextualHeader && "max-md:hidden",
    )}>
      <div className="relative flex h-15 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2">
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGiveFeedback}
            className="hidden h-9 rounded-[0.85rem] border border-border/22 bg-transparent px-3 text-muted-foreground/88 hover:bg-card/20 hover:text-foreground md:inline-flex"
          >
            <MessageSquare className="size-4" />
            <span>Feedback</span>
          </Button>
        </div>

        <div className="pointer-events-none absolute inset-x-14 flex min-w-0 justify-center md:hidden">
          {renderMobileRouteMark(standardHeaderTitle)}
        </div>

        <div className="pointer-events-none absolute inset-x-0 hidden justify-center md:flex">
          <div className="pointer-events-none inline-flex max-w-[22rem] items-center justify-center px-4">
            <span className="truncate text-sm font-medium text-foreground">
              {standardHeaderTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSearchRoute ? (
            <NewReviewDialog
              isAuthenticated={Boolean(profile)}
              intent="search"
              trigger={
                <motion.button
                  type="button"
                  className="hidden h-9 items-center gap-2 rounded-[0.85rem] border border-border/24 bg-card/24 px-3 text-sm text-muted-foreground/88 transition-colors hover:bg-card/36 hover:text-foreground md:inline-flex"
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : {
                          y: -1,
                        }
                  }
                  whileTap={
                    prefersReducedMotion
                      ? undefined
                      : {
                          scale: 0.992,
                        }
                  }
                >
                  <Search className="size-4" />
                  <span>Search</span>
                  <Kbd className="h-5 gap-1.5 rounded-md border border-border/45 bg-muted/22 px-1.5 text-[0.6rem] text-muted-foreground">
                    <CommandIcon className="size-3 text-muted-foreground" />
                    <span>K</span>
                  </Kbd>
                </motion.button>
              }
            />
          ) : null}
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
        <header className="fixed inset-x-0 top-0 z-30 bg-background/72 backdrop-blur-xl md:hidden">
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

            <div className="pointer-events-none absolute inset-x-16 flex min-w-0 justify-center">
              {renderMobileRouteMark(standardHeaderTitle)}
            </div>

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
