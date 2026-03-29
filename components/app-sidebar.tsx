"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, Compass, Disc3, Plus, Search } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import NewReviewDialog from "@/components/new-review-dialog";
import { NavMain } from "@/components/nav-main";
import { NavRecentReviews } from "@/components/nav-recent-reviews";
import { NavSecondary } from "@/components/nav-secondary";
import { Kbd } from "@/components/ui/kbd";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

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

type SidebarRecentTrack = {
  entityId: string;
  title: string;
  artistName: string | null;
  coverUrl: string | null;
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  profile: AppSidebarProfile | null;
  recentTracks?: SidebarRecentTrack[];
  unreadCount?: number;
};

export default function AppSidebar({
  profile,
  recentTracks = [],
  unreadCount = 0,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const previousPathnameRef = useRef(pathname);

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
      title: "Discover",
      url: "/search",
      icon: Search,
      isActive: pathname.startsWith("/search"),
    },
    {
      title: "Tracks",
      url: "/track",
      icon: Disc3,
      isActive: pathname.startsWith("/track"),
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

  const canShowRecentReviews = Boolean(profile) && recentTracks.length > 0;

  return (
    <TooltipProvider delayDuration={80}>
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-sidebar-border/70 !p-1.5 group-data-[collapsible=icon]:!p-1"
        {...props}
      >
        <SidebarHeader className="gap-2.5 p-2.5 group-data-[collapsible=icon]:gap-1.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:py-1.5">
          <Link
            href="/"
            onClick={closeMobileSidebar}
            className="flex h-10 items-center justify-start rounded-xl px-2 transition-colors hover:bg-sidebar-accent/70 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <BrandLogo priority iconClassName="h-5 w-5" />
          </Link>

        <div className="group-data-[collapsible=icon]:hidden">
          <NewReviewDialog
            isAuthenticated={Boolean(profile)}
            trigger={
              <button
                type="button"
                className="flex h-9 w-full items-center justify-between rounded-xl bg-sidebar-primary px-2.5 text-[13px] text-sidebar-primary-foreground shadow-none transition-colors hover:bg-sidebar-primary/95"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="size-4" />
                  <span>New review</span>
                </span>
                <Kbd className="border border-sidebar-primary-foreground/12 bg-sidebar-primary-foreground/10 px-1.5 text-[0.6rem] text-sidebar-primary-foreground/78">
                  N
                </Kbd>
              </button>
            }
          />
        </div>

          <div className="hidden group-data-[collapsible=icon]:block">
            <NewReviewDialog
              isAuthenticated={Boolean(profile)}
              trigger={
                <button
                  type="button"
                  aria-label="New review"
                  className="mx-auto flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground transition-colors hover:bg-sidebar-primary/95"
                >
                  <Plus className="size-4" />
                </button>
              }
            />
          </div>

          <SidebarGroup className="px-0 py-0 group-data-[collapsible=icon]:hidden">
            <SidebarGroupContent>
              <Link
                href="/search"
                onClick={closeMobileSidebar}
                className="flex h-9 items-center gap-2 rounded-xl border border-sidebar-border bg-background/40 px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              >
                <Search className="size-4 shrink-0" />
                <span>Search tracks</span>
                <Kbd className="ml-auto border border-sidebar-border/70 bg-sidebar-accent/55 px-1.5 text-[0.6rem] text-muted-foreground">
                  F
                </Kbd>
              </Link>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarHeader>

        <SidebarContent className="gap-1.5 px-1 pb-2.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:pb-1.5">
          <NavMain items={mainItems} onNavigate={closeMobileSidebar} />
          {secondaryItems.length > 0 ? <NavSecondary items={secondaryItems} onNavigate={closeMobileSidebar} /> : null}
          {canShowRecentReviews ? <NavRecentReviews items={recentTracks} onNavigate={closeMobileSidebar} /> : null}
        </SidebarContent>

        <SidebarFooter className="p-2.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:py-1.5">
          <NavUser profile={profile} onNavigate={closeMobileSidebar} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}
