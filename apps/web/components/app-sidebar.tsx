"use client";

import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import {
  ChatCircleTextIcon,
  MagnifyingGlassIcon,
} from "@/components/ui/icons";
import BrandLogo from "@/components/brand-logo";
import {
  KocteauActivityIcon,
  KocteauHealthIcon,
  KocteauHomeIcon,
  KocteauLibraryIcon,
  KocteauSearchIcon,
  KocteauStarterIcon,
  ReviewGlyphIcon,
} from "@/components/kocteau-icons";
import PrefetchLink from "@/components/prefetch-link";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { Kbd } from "@/components/ui/kbd";
import { NavUser } from "@/components/nav-user";
import { OPEN_NEW_REVIEW_SHORTCUT_EVENT } from "@/hooks/use-global-shortcuts";
import { notificationsUnreadCountKey } from "@/hooks/use-notifications";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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

function SidebarHeaderAction({
  label,
  shortcut,
  emphasis = false,
  href,
  onClick,
  children,
}: {
  label: string;
  shortcut: string;
  emphasis?: boolean;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const { isMobile, state } = useSidebar();
  const tooltipSide = state === "collapsed" && !isMobile ? "right" : "bottom";
  const actionClassName = cn(
    "relative inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sidebar-foreground outline-hidden transition-[background-color,border-color,color] duration-[180ms] ease-[var(--kocteau-ease)] after:absolute after:-inset-1 focus-visible:ring-2 focus-visible:ring-[var(--kocteau-focus-ring)]",
    emphasis
      ? "border border-sidebar-border/58 bg-sidebar-accent/78 text-sidebar-foreground hover:border-sidebar-border/78 hover:bg-sidebar-accent/94"
      : "border border-transparent bg-transparent text-sidebar-foreground/56 hover:text-sidebar-foreground",
  );
  const action = href ? (
    <PrefetchLink
      href={href}
      aria-label={`${label} (${shortcut})`}
      onClick={onClick}
      className={actionClassName}
    >
      {children}
    </PrefetchLink>
  ) : (
    <button
      type="button"
      aria-label={`${label} (${shortcut})`}
      onClick={onClick}
      className={actionClassName}
    >
      {children}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{action}</TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align="center"
        sideOffset={tooltipSide === "right" ? 8 : 7}
      >
        <span className="inline-flex items-center gap-2.5">
          <span>{label}</span>
          <Kbd className="grid size-5 min-w-5 place-items-center rounded-full border-0 !bg-foreground/[0.12] p-0 text-center text-[0.62rem] font-semibold leading-none tabular-nums !text-foreground/90 shadow-none in-data-[slot=tooltip-content]:!bg-foreground/[0.12] in-data-[slot=tooltip-content]:!text-foreground/90">
            <span className="block translate-y-px leading-none">{shortcut}</span>
          </Kbd>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

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

  const openNewReview = useCallback(() => {
    window.dispatchEvent(new CustomEvent(OPEN_NEW_REVIEW_SHORTCUT_EVENT));
    closeMobileSidebar();
  }, [closeMobileSidebar]);

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
      icon: KocteauHomeIcon,
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
          icon: KocteauLibraryIcon,
          isActive: pathname.startsWith("/library") || pathname.startsWith("/saved"),
        },
        {
          title: "Activity",
          url: "/notifications",
          icon: KocteauActivityIcon,
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
          icon: KocteauStarterIcon,
          isActive: pathname.startsWith("/studio/starter"),
        },
        {
          title: "Health",
          url: "/studio/health",
          icon: KocteauHealthIcon,
          isActive: pathname.startsWith("/studio/health"),
        },
      ]
    : [];

  return (
    <TooltipProvider delayDuration={80}>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="group-data-[collapsible=icon]:border-none"
        {...props}
      >
        <SidebarHeader className="gap-2 p-2.5 group-data-[collapsible=icon]:gap-1.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:py-1.5">
          <div className="flex min-h-10 items-center justify-between gap-2 px-1.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-1.5 group-data-[collapsible=icon]:px-0">
            <PrefetchLink
              href="/"
              onClick={closeMobileSidebar}
              queryWarmup={{ kind: "feed" }}
              aria-label="Kocteau home"
              className="flex size-9 shrink-0 items-center justify-start rounded-full transition-transform duration-[180ms] ease-[var(--kocteau-ease)] active:scale-[0.96] group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
            >
              <BrandLogo priority iconClassName="h-5 w-5" />
            </PrefetchLink>

            <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1.5">
              <SidebarHeaderAction
                label="Search"
                shortcut="/"
                href="/search"
                onClick={closeMobileSidebar}
              >
                <KocteauSearchIcon className="size-4" />
              </SidebarHeaderAction>
              <SidebarHeaderAction
                label="Create new review"
                shortcut="C"
                emphasis
                onClick={openNewReview}
              >
                <ReviewGlyphIcon className="size-4" />
              </SidebarHeaderAction>
            </div>
          </div>
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
