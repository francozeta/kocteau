"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  Compass,
  Disc3,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import NewReviewDialog from "@/components/new-review-dialog";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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

type AppSidebarProps = {
  profile: AppSidebarProfile | null;
};

type SidebarNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

function SidebarSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: SidebarNavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup className="px-3 py-0">
      <SidebarGroupLabel className="px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-sidebar-foreground/45">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  size="lg"
                  className={cn(
                    "h-11 rounded-2xl px-3 text-[13px] font-medium text-sidebar-foreground/70 transition-all",
                    "hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
                    active &&
                      "bg-sidebar-accent/90 text-sidebar-foreground shadow-[inset_0_0_0_1px_hsl(var(--sidebar-border))]",
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="size-4.5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname();

  const exploreItems: SidebarNavItem[] = [
    {
      href: "/",
      label: "Feed",
      icon: Compass,
      match: (current) => current === "/",
    },
    {
      href: "/search",
      label: "Search",
      icon: Search,
      match: (current) => current.startsWith("/search"),
    },
    {
      href: "/track",
      label: "Tracks",
      icon: Disc3,
      match: (current) => current.startsWith("/track"),
    },
  ];

  const libraryItems: SidebarNavItem[] = profile
    ? [
        {
          href: "/saved",
          label: "Saved",
          icon: Bookmark,
          match: (current) => current.startsWith("/saved"),
        },
        {
          href: "/notifications",
          label: "Notifications",
          icon: Bell,
          match: (current) => current.startsWith("/notifications"),
        },
        {
          href: `/u/${profile.username}`,
          label: "Profile",
          icon: UserRound,
          match: (current) => current.startsWith(`/u/${profile.username}`),
        },
      ]
    : [];

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r-0 md:border-r-0"
    >
      <SidebarHeader className="gap-4 px-4 py-4">
        <div className="flex items-center gap-3 px-2">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <BrandLogo priority iconClassName="h-6 w-6" />
          </Link>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[11px] uppercase tracking-[0.26em] text-sidebar-foreground/40">
              Kocteau
            </p>
            <p className="text-sm text-sidebar-foreground/70">
              Music notes, not noise.
            </p>
          </div>
        </div>

        <div className="px-2">
          <NewReviewDialog
            isAuthenticated={Boolean(profile)}
            triggerClassName={cn(
              "h-11 w-full justify-start rounded-2xl bg-sidebar-primary px-3 text-[13px] font-medium text-sidebar-primary-foreground",
              "shadow-none hover:bg-sidebar-primary/90 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
            )}
            triggerLabelClassName="group-data-[collapsible=icon]:hidden"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-5 px-1 pb-3">
        <SidebarSection label="Listen" items={exploreItems} pathname={pathname} />
        {libraryItems.length > 0 ? (
          <SidebarSection label="Library" items={libraryItems} pathname={pathname} />
        ) : null}
      </SidebarContent>

      <SidebarFooter className="gap-3 px-4 py-4">
        <SidebarSeparator className="mx-0 bg-sidebar-border/70" />
        {profile ? (
          <div className="group-data-[collapsible=icon]:hidden">
            <Link
              href={`/u/${profile.username}`}
              className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-sidebar-accent/70"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-foreground">
                {(profile.display_name ?? profile.username).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {profile.display_name ?? `@${profile.username}`}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/55">
                  @{profile.username}
                </p>
              </div>
            </Link>

            <ProfileSettingsDialog
              profile={profile}
              trigger={
                <button
                  type="button"
                  className="mt-2 flex h-10 w-full items-center justify-between rounded-2xl px-3 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                >
                  <span>Edit profile</span>
                  <Settings2 className="size-4" />
                </button>
              }
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 p-4 text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            <p className="font-medium text-sidebar-foreground">Browse first.</p>
            <p className="mt-1 leading-6 text-sidebar-foreground/55">
              Sign in when you want to publish, save, or join the conversation.
            </p>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
