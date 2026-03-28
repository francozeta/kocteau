"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, Compass, Disc3, Search } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import NewReviewDialog from "@/components/new-review-dialog";
import { NavMain } from "@/components/nav-main";
import { NavRecentReviews } from "@/components/nav-recent-reviews";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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
        <SidebarHeader className="gap-2.5 p-2.5 group-data-[collapsible=icon]:gap-1.5 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-1.5">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                className="h-10 justify-start rounded-xl px-2 data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              >
                <Link href="/">
                  <BrandLogo priority iconClassName="h-5 w-5" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

        <div className="group-data-[collapsible=icon]:hidden">
          <NewReviewDialog
            isAuthenticated={Boolean(profile)}
              triggerClassName="h-9 w-full justify-center rounded-xl bg-sidebar-primary px-2.5 text-[13px] text-sidebar-primary-foreground shadow-none hover:bg-sidebar-primary/95"
              triggerLabelClassName="inline"
            />
          </div>

          <div className="hidden group-data-[collapsible=icon]:block">
            <NewReviewDialog
              isAuthenticated={Boolean(profile)}
              triggerClassName="size-9 justify-center rounded-xl bg-sidebar-primary px-0 text-sidebar-primary-foreground shadow-none hover:bg-sidebar-primary/95"
              triggerLabelClassName="sr-only"
            />
          </div>

          <SidebarGroup className="px-0 py-0 group-data-[collapsible=icon]:hidden">
            <SidebarGroupContent>
              <Link
                href="/search"
                className="flex h-9 items-center gap-2 rounded-xl border border-sidebar-border bg-background/40 px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              >
                <Search className="size-4 shrink-0" />
                <span>Search tracks</span>
              </Link>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarHeader>

        <SidebarContent className="gap-1.5 px-1 pb-2.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:pb-1.5">
          <NavMain items={mainItems} />
          {secondaryItems.length > 0 ? <NavSecondary items={secondaryItems} /> : null}
          {canShowRecentReviews ? <NavRecentReviews items={recentTracks} /> : null}
        </SidebarContent>

        <SidebarFooter className="p-2.5 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-1.5">
          <NavUser profile={profile} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}
