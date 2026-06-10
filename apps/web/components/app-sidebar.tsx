"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import {
  BellSimpleIcon,
  BookmarkSimpleIcon,
  ChatCircleTextIcon,
  GearSixIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  Sparkles,
} from "@/components/ui/icons";
import BrandLogo from "@/components/brand-logo";
import NewReviewDialog from "@/components/new-review-dialog";
import PrefetchLink from "@/components/prefetch-link";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { Kbd } from "@/components/ui/kbd";
import { NavUser } from "@/components/nav-user";
import { notificationsUnreadCountKey } from "@/hooks/use-notifications";
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
  unreadCount?: number;
  canAccessStudio?: boolean;
};

export default function AppSidebar({
  profile,
  unreadCount: initialUnreadCount = 0,
  canAccessStudio = false,
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
      icon: HouseIcon,
      isActive: pathname === "/",
    },
    {
      title: "Explore",
      url: "/search",
      icon: MagnifyingGlassIcon,
      isActive: pathname.startsWith("/search") || pathname.startsWith("/track"),
    },
    {
      title: "Feedback",
      url: FEEDBACK_URL,
      icon: ChatCircleTextIcon,
      external: true,
    },
  ];

  const secondaryItems = profile
    ? [
        {
          title: "Library",
          url: "/library",
          icon: BookmarkSimpleIcon,
          isActive: pathname.startsWith("/library") || pathname.startsWith("/saved"),
        },
        {
          title: "Activity",
          url: "/notifications",
          icon: BellSimpleIcon,
          isActive: pathname.startsWith("/notifications"),
          badge: unreadCount,
        },
      ]
    : [];
  const studioItems = canAccessStudio
    ? [
        {
          title: "Starter",
          url: "/studio/starter",
          icon: Sparkles,
          isActive: pathname.startsWith("/studio/starter"),
        },
        {
          title: "Health",
          url: "/studio/health",
          icon: GearSixIcon,
          isActive: pathname.startsWith("/studio/health"),
        },
      ]
    : [];

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
            className="flex h-10 items-center justify-start rounded-xl px-2 transition-[background-color,transform,padding,width,height] duration-[180ms] ease-[var(--kocteau-ease)] hover:bg-sidebar-accent/70 active:scale-[0.96] group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <BrandLogo priority iconClassName="h-5 w-5" />
          </PrefetchLink>

          <NewReviewDialog
            isAuthenticated={Boolean(profile)}
            intent="review"
            trigger={
              <button
                type="button"
                aria-label={reviewEntryLabel}
                className="flex h-9 w-full items-center justify-start gap-2 overflow-hidden rounded-[0.7rem] border border-sidebar-border/70 bg-[var(--kocteau-surface-control)] px-2.5 text-[13px] font-medium text-sidebar-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[width,height,padding,gap,color,background-color,transform,box-shadow] duration-[180ms] ease-[var(--kocteau-ease)] hover:bg-[var(--kocteau-surface-control-hover)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.24)] active:scale-[0.96] group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
              >
                <span className="inline-flex min-w-0 items-center justify-center gap-2 transition-[gap] duration-[180ms] ease-[var(--kocteau-ease)] group-data-[collapsible=icon]:gap-0">
                  <ReviewGlyphIcon className="size-4 shrink-0" />
                  <span className="kocteau-sidebar-label">{reviewEntryLabel}</span>
                </span>
                <span className="kocteau-sidebar-shortcut">
                  <Kbd className="border border-sidebar-border/80 bg-foreground/[0.06] px-1.5 text-[0.6rem] text-muted-foreground">
                    N
                  </Kbd>
                </span>
              </button>
            }
          />
        </SidebarHeader>

        <SidebarContent className="gap-1.5 px-1 pb-2.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:pb-1.5">
          <NavMain items={mainItems} onNavigate={closeMobileSidebar} />
          {secondaryItems.length > 0 ? <NavSecondary items={secondaryItems} onNavigate={closeMobileSidebar} /> : null}
          {studioItems.length > 0 ? (
            <NavSecondary
              items={studioItems}
              label="Studio"
              onNavigate={closeMobileSidebar}
            />
          ) : null}
        </SidebarContent>

        <SidebarFooter className="px-1 pb-2.5 pt-2 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:py-1.5">
          <NavUser
            profile={profile}
            onNavigate={closeMobileSidebar}
            initialUnreadCount={unreadCount}
          />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}
