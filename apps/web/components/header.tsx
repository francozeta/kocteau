"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  KocteauChevronLeftMediumIcon,
  KocteauExternalIcon,
  KocteauMoreIcon,
  KocteauShareIcon,
} from "@/components/kocteau-icons";
import ReviewActionsMenu from "@/components/review-actions-menu";
import { useRouteHeader } from "@/components/route-header-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { shareUrl } from "@/lib/share";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

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
}: {
  profile: HeaderProfile | null;
}) {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [detailActionsOpen, setDetailActionsOpen] = useState(false);
  const { detailHeader } = useRouteHeader();
  const isMobileReviewRoute = /^\/review\/[^/]+$/.test(pathname) || /^\/reviews\/[^/]+\/[^/]+$/.test(pathname);
  const isTrackDetailRoute =
    /^\/track\/[^/]+$/.test(pathname) ||
    /^\/tracks\/[^/]+\/[^/]+$/.test(pathname) ||
    /^\/tracks\/[^/]+\/[^/]+\/[^/]+$/.test(pathname);
  const isProfileDetailRoute = /^\/u\/[^/]+$/.test(pathname);
  const shouldUseContextualHeader = isTrackDetailRoute || isProfileDetailRoute || isMobileReviewRoute;
  const isSearchRoute = pathname.startsWith("/search");
  const isSettingsRoute = pathname === "/settings";

  const standardHeaderTitle = (() => {
    if (isTrackDetailRoute) {
      return detailHeader?.shareLabel ?? "Track";
    }

    if (isProfileDetailRoute) {
      return detailHeader?.shareLabel ?? "Profile";
    }

    if (isMobileReviewRoute) {
      return detailHeader?.shareLabel ?? "Review";
    }

    if (pathname === "/feed") {
      return "Feed";
    }

    if (isSettingsRoute) {
      return "Settings";
    }

    if (isSearchRoute) {
      return "Search";
    }

    if (pathname === "/track") {
      return "Tracks";
    }

    if (pathname.startsWith("/library") || pathname.startsWith("/saved")) {
      return "Library";
    }

    if (pathname.startsWith("/notifications")) {
      return "Activity";
    }

    if (pathname.startsWith("/review/") || pathname.startsWith("/reviews/")) {
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

  const handleDetailBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(
      isProfileDetailRoute
        ? profile
          ? "/feed"
          : "/"
        : isMobileReviewRoute
          ? "/reviews"
          : "/search",
    );
  }, [isMobileReviewRoute, isProfileDetailRoute, profile, router]);

  const handleSettingsBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(profile?.username ? `/u/${profile.username}` : "/feed");
  }, [profile, router]);

  const handleShareDetail = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const detailKind =
      detailHeader?.kind ?? (isProfileDetailRoute ? "profile" : isMobileReviewRoute ? "review" : "track");
    const absoluteUrl = new URL(detailHeader?.sharePath ?? pathname, window.location.origin).toString();
    const detailLabel =
      detailKind === "profile" ? "Profile" : detailKind === "review" ? "Review" : "Track";

    await shareUrl({
      title: detailHeader?.shareLabel ?? document.title,
      url: absoluteUrl,
      successMessage: `${detailLabel} link copied`,
      errorMessage: `We couldn't share this ${detailLabel.toLowerCase()} right now.`,
    });
  }, [detailHeader, isMobileReviewRoute, isProfileDetailRoute, pathname]);

  const standardHeader = (
    <header className={cn(
      "pointer-events-none fixed inset-x-0 top-0 z-30 px-3 pt-[calc(env(safe-area-inset-top)+0.55rem)] md:pointer-events-auto md:static md:inset-auto md:top-auto md:z-10 md:flex-none md:bg-transparent md:px-0 md:pt-0 md:backdrop-blur-none md:shadow-[inset_0_-1px_0_rgba(255,255,255,0.045)]",
      isMobileReviewRoute && "max-md:hidden",
      shouldUseContextualHeader && "max-md:hidden",
    )}>
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-24 w-screen -translate-x-1/2 bg-[linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.94)_42%,transparent_100%)] md:hidden"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-11 items-center justify-between gap-3 md:h-16 md:px-6">
        <div className="relative z-10 flex items-center gap-2">
          {isSettingsRoute ? (
            <button
              type="button"
              onClick={handleSettingsBack}
              className="pointer-events-auto inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-sm text-muted-foreground transition-[color,transform] duration-150 hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              aria-label="Go back"
            >
              <KocteauChevronLeftMediumIcon className="size-5" />
              <span>Back</span>
            </button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={toggleSidebar}
              className="pointer-events-auto size-11 rounded-full border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground active:scale-[0.96] md:hidden"
              aria-label="Toggle navigation"
            >
              <HamburgerIcon className="size-[1.15rem]" />
            </Button>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 md:block md:px-7 xl:px-8">
          <div className="mx-auto flex w-full max-w-[76rem] items-center">
            <span className="truncate font-pixel text-[0.82rem] font-medium tracking-[-0.012em] text-foreground/92">
              {standardHeaderTitle}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1.5">
          {shouldUseContextualHeader ? (
            <div className="hidden items-center gap-1 md:flex">
              <button
                type="button"
                onClick={() => void handleShareDetail()}
                className="flex size-10 items-center justify-center rounded-full border-0 bg-transparent p-0 text-muted-foreground transition-[color,transform] duration-150 hover:text-foreground active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
                aria-label={isProfileDetailRoute ? "Share profile" : isMobileReviewRoute ? "Share review" : "Share track"}
              >
                <KocteauShareIcon className="size-[1.05rem]" />
              </button>

              {detailHeader?.kind === "review" && detailHeader.reviewId && detailHeader.reviewActions ? (
                <ReviewActionsMenu
                  reviewId={detailHeader.reviewId}
                  reviewTitle={detailHeader.reviewActions.reviewTitle}
                  entityTitle={detailHeader.reviewActions.entityTitle}
                  entityId={detailHeader.reviewActions.entityId}
                  reviewPath={detailHeader.sharePath}
                  entityPath={detailHeader.reviewActions.entityPath}
                  canManage={detailHeader.reviewActions.canManage}
                  editSeed={detailHeader.reviewActions.editSeed}
                  initialBookmarked={detailHeader.reviewActions.initialBookmarked}
                  isAuthenticated={detailHeader.reviewActions.isAuthenticated}
                  trigger={(
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center rounded-full border-0 bg-transparent p-0 text-muted-foreground transition-[color,transform] duration-150 hover:text-foreground active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
                      aria-label="Review actions"
                    >
                      <KocteauMoreIcon className="size-[1.05rem]" />
                    </button>
                  )}
                />
              ) : (detailHeader?.externalLinks.length ?? 0) > 0 ? (
                <Dialog open={detailActionsOpen} onOpenChange={setDetailActionsOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center rounded-full border-0 bg-transparent p-0 text-muted-foreground transition-[color,transform] duration-150 hover:text-foreground active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
                      aria-label={isProfileDetailRoute ? "Profile actions" : "Track actions"}
                    >
                      <KocteauMoreIcon className="size-[1.05rem]" />
                    </button>
                  </DialogTrigger>
                  <DialogContent
                    showCloseButton={false}
                    className="w-[22rem] max-w-[calc(100%_-_2rem)] gap-0 rounded-[1.2rem] border-border/28 bg-background p-2 shadow-none"
                  >
                    <DialogHeader className="px-3 pb-2 pt-2">
                      <DialogTitle>Open in</DialogTitle>
                      <DialogDescription className="sr-only">
                        Open this page in another music service.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1">
                      {detailHeader?.externalLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setDetailActionsOpen(false)}
                          className="flex min-h-10 w-full items-center gap-3 rounded-[0.72rem] px-3 text-sm font-medium text-foreground/88 transition-colors hover:bg-foreground/[0.055] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
                        >
                          <KocteauExternalIcon className="size-[1.05rem]" />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>
          ) : null}

          {profile ? null : (
            <Link href="/login">
              <Button
                variant="default"
                size="sm"
                className="pointer-events-auto h-8 rounded-full border-0 px-2.5 text-[12px] font-medium shadow-none transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] sm:px-3 sm:text-[13px]"
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
            className="pointer-events-none absolute left-1/2 top-0 h-24 w-screen -translate-x-1/2 bg-[linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.94)_42%,transparent_100%)]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex h-11 items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDetailBack}
              className="pointer-events-auto relative z-10 flex size-11 items-center justify-center rounded-full border-0 bg-transparent p-0 text-foreground transition-[transform,color] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              aria-label="Go back"
            >
              <KocteauChevronLeftMediumIcon className="size-5" />
            </button>

            <div className="pointer-events-none absolute inset-x-14 top-1/2 -translate-y-1/2 text-center">
              <span className="block truncate font-pixel text-[0.76rem] font-medium tracking-[-0.01em] text-foreground/90">
                {detailHeader?.title ?? standardHeaderTitle}
              </span>
            </div>

            <div className="pointer-events-auto relative z-10 inline-flex items-center">
              {detailHeader?.kind === "review" && detailHeader.reviewId && detailHeader.reviewActions ? (
                <ReviewActionsMenu
                  reviewId={detailHeader.reviewId}
                  reviewTitle={detailHeader.reviewActions.reviewTitle}
                  entityTitle={detailHeader.reviewActions.entityTitle}
                  entityId={detailHeader.reviewActions.entityId}
                  reviewPath={detailHeader.sharePath}
                  entityPath={detailHeader.reviewActions.entityPath}
                  canManage={detailHeader.reviewActions.canManage}
                  editSeed={detailHeader.reviewActions.editSeed}
                  initialBookmarked={detailHeader.reviewActions.initialBookmarked}
                  isAuthenticated={detailHeader.reviewActions.isAuthenticated}
                  trigger={(
                    <button
                      type="button"
                      className="flex size-11 items-center justify-center rounded-full border-0 bg-transparent p-0 text-muted-foreground transition-[transform,color] duration-150 hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                      aria-label="Review actions"
                    >
                      <KocteauMoreIcon className="size-5" />
                    </button>
                  )}
                />
              ) : (
                <Drawer open={detailActionsOpen} onOpenChange={setDetailActionsOpen}>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center rounded-full border-0 bg-transparent p-0 text-muted-foreground transition-[transform,color] duration-150 hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                    aria-label={isProfileDetailRoute ? "Profile actions" : "Track actions"}
                  >
                    <KocteauMoreIcon className="size-5" />
                  </button>
                </DrawerTrigger>

                <DrawerContent className="p-0 text-foreground before:inset-0 before:rounded-t-[1.35rem] before:border-x before:border-b-0 before:border-t before:border-border/36 before:bg-background">
                  <DrawerHeader className="px-4 pb-3 pt-4 text-left">
                    <DrawerTitle>
                      {isProfileDetailRoute ? "Profile actions" : "Track actions"}
                    </DrawerTitle>
                    <DrawerDescription className="sr-only">
                      Share this page or open it in another service.
                    </DrawerDescription>
                  </DrawerHeader>

                  <div className="space-y-2 px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailActionsOpen(false);
                        void handleShareDetail();
                      }}
                      className="flex min-h-11 w-full items-center gap-3 rounded-full bg-white/[0.08] px-4 text-sm font-medium text-foreground transition-[transform,background-color] duration-150 hover:bg-white/[0.12] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                    >
                      <KocteauShareIcon className="size-4" />
                      {isProfileDetailRoute ? "Share profile" : "Share track"}
                    </button>

                    {(detailHeader?.externalLinks ?? []).map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setDetailActionsOpen(false)}
                        className="flex min-h-11 w-full items-center gap-3 rounded-full bg-white/[0.08] px-4 text-sm font-medium text-foreground transition-[transform,background-color] duration-150 hover:bg-white/[0.12] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                      >
                        <KocteauExternalIcon className="size-4" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </DrawerContent>
                </Drawer>
              )}
            </div>
          </div>
        </header>
        {standardHeader}
      </>
    );
  }

  return standardHeader;
}
