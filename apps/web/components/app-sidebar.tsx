"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, Compass, Plus, Search } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import NewReviewDialog from "@/components/new-review-dialog";
import { NavOwnedReviews } from "@/components/nav-owned-reviews";
import PrefetchLink from "@/components/prefetch-link";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { Kbd } from "@/components/ui/kbd";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

export type SidebarOwnedReview = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  is_pinned?: boolean;
  entity: {
    provider: "deezer";
    provider_id: string;
    type: "track";
    title: string;
    artist_name: string | null;
    cover_url: string | null;
    deezer_url: string | null;
    entity_id: string;
  };
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  profile: AppSidebarProfile | null;
  ownedReviews?: SidebarOwnedReview[];
  unreadCount?: number;
};

export default function AppSidebar({
  profile,
  ownedReviews = [],
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
      title: "Explore",
      url: "/search",
      icon: Search,
      isActive: pathname.startsWith("/search") || pathname.startsWith("/track"),
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

  const canShowOwnedReviews = Boolean(profile) && ownedReviews.length > 0;

  return (
    <TooltipProvider delayDuration={80}>
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-sidebar-border/70 !p-1.5 group-data-[collapsible=icon]:!p-1"
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
        </SidebarHeader>

        <SidebarContent className="gap-1.5 px-1 pb-2.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:pb-1.5">
          <NavMain items={mainItems} onNavigate={closeMobileSidebar} />
          {secondaryItems.length > 0 ? <NavSecondary items={secondaryItems} onNavigate={closeMobileSidebar} /> : null}
          {canShowOwnedReviews ? <NavOwnedReviews items={ownedReviews} onNavigate={closeMobileSidebar} /> : null}
        </SidebarContent>

        <SidebarFooter className="px-1 pb-2.5 pt-2 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:py-1.5">
          <NavUser profile={profile} onNavigate={closeMobileSidebar} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}
