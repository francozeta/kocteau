"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, Compass, MessageSquare, Search } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import NewReviewDialog from "@/components/new-review-dialog";
import { NavOwnedReviews } from "@/components/nav-owned-reviews";
import PrefetchLink from "@/components/prefetch-link";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { Kbd } from "@/components/ui/kbd";
import { NavUser } from "@/components/nav-user";
import { notificationsUnreadCountKey } from "@/hooks/use-notifications";
import type { SidebarOwnedReview } from "@/lib/types/sidebar";
import { fetchJson } from "@/queries/http";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const FEEDBACK_URL = "https://github.com/francozeta/kocteau/issues/new";

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

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  profile: AppSidebarProfile | null;
  ownedReviews?: SidebarOwnedReview[];
  unreadCount?: number;
};

export default function AppSidebar({
  profile,
  ownedReviews = [],
  unreadCount: initialUnreadCount = 0,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const previousPathnameRef = useRef(pathname);
  const { data: unreadCount = initialUnreadCount } = useQuery<number>({
    queryKey: notificationsUnreadCountKey,
    queryFn: async () => initialUnreadCount,
    enabled: false,
    placeholderData: initialUnreadCount,
  });
  const { data: sidebarReviews = ownedReviews } = useQuery({
    queryKey: ["viewer", "sidebar-reviews"],
    queryFn: async () => {
      const payload = await fetchJson<{ reviews?: SidebarOwnedReview[] }>(
        "/api/viewer/sidebar-reviews",
      );

      return Array.isArray(payload.reviews) ? payload.reviews : [];
    },
    initialData: ownedReviews,
    enabled: Boolean(profile),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const closeMobileSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  useEffect(() => {
    if (!isMobile) {
      previousPathnameRef.current = pathname;
      return;
    }

    const previousPathname = previousPathnameRef.current;

    if (openMobile && previousPathname !== pathname) {
      setOpenMobile(false);
    }

    previousPathnameRef.current = pathname;
  }, [isMobile, openMobile, pathname, setOpenMobile]);

  const mainItems = [
    {
      title: "Feed",
      url: "/",
      icon: Compass,
      isActive: pathname === "/",
    },
    {
      title: "Explore",
      url: "/search",
      icon: Search,
      isActive: pathname.startsWith("/search") || pathname.startsWith("/track"),
    },
    {
      title: "Feedback",
      url: FEEDBACK_URL,
      icon: MessageSquare,
      external: true,
    },
  ];

  const secondaryItems = profile
    ? [
        {
          title: "Saved",
          url: "/saved",
          icon: Bookmark,
          isActive: pathname.startsWith("/saved"),
        },
        {
          title: "Activity",
          url: "/notifications",
          icon: Bell,
          isActive: pathname.startsWith("/notifications"),
          badge: unreadCount,
        },
      ]
    : [];

  const canShowOwnedReviews = Boolean(profile) && sidebarReviews.length > 0;
  const reviewEntryLabel = profile ? "New review" : "Find a track";

  return (
    <TooltipProvider delayDuration={80}>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="group-data-[collapsible=icon]:border-none"
        {...props}
      >
        <SidebarHeader className="gap-2.5 p-2.5 group-data-[collapsible=icon]:gap-1.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:py-1.5">
          <PrefetchLink
            href="/"
            onClick={closeMobileSidebar}
            queryWarmup={{ kind: "feed" }}
            className="flex h-10 items-center justify-start rounded-xl px-2 transition-colors hover:bg-sidebar-accent/70 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <BrandLogo priority iconClassName="h-5 w-5" />
          </PrefetchLink>

          <div className="group-data-[collapsible=icon]:hidden">
            <NewReviewDialog
              isAuthenticated={Boolean(profile)}
              intent="review"
              trigger={
                <button
                  type="button"
                  className="flex h-9 w-full items-center justify-between rounded-[0.7rem] border border-sidebar-border/70 bg-[var(--kocteau-surface-control)] px-2.5 text-[13px] font-medium text-sidebar-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[color,background-color,transform,box-shadow] hover:bg-[var(--kocteau-surface-control-hover)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.24)] active:scale-[0.96]"
                >
                  <span className="inline-flex items-center gap-2">
                    <ReviewGlyphIcon className="size-4" />
                    <span>{reviewEntryLabel}</span>
                  </span>
                  <Kbd className="border border-sidebar-border/80 bg-foreground/[0.06] px-1.5 text-[0.6rem] text-muted-foreground">
                    N
                  </Kbd>
                </button>
              }
            />
          </div>

          <div className="hidden group-data-[collapsible=icon]:block">
            <NewReviewDialog
              isAuthenticated={Boolean(profile)}
              intent="review"
              trigger={
                <button
                  type="button"
                  aria-label={reviewEntryLabel}
                  className="mx-auto flex size-9 items-center justify-center rounded-[0.7rem] border border-sidebar-border/70 bg-[var(--kocteau-surface-control)] text-sidebar-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[color,background-color,transform] hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96]"
                >
                  <ReviewGlyphIcon className="size-4" />
                </button>
              }
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-1.5 px-1 pb-2.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:pb-1.5">
          <NavMain items={mainItems} onNavigate={closeMobileSidebar} />
          {secondaryItems.length > 0 ? <NavSecondary items={secondaryItems} onNavigate={closeMobileSidebar} /> : null}
          {canShowOwnedReviews ? <NavOwnedReviews items={sidebarReviews} onNavigate={closeMobileSidebar} /> : null}
        </SidebarContent>

        <SidebarFooter className="px-1 pb-2.5 pt-2 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:py-1.5">
          <NavUser profile={profile} onNavigate={closeMobileSidebar} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}
