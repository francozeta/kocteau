"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellSimpleIcon,
  BookmarkSimpleIcon,
  GearSixIcon,
  SignOutIcon,
  SparkleIcon,
  UserCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import NotificationsButton from "@/components/notifications-button";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import UserAvatar from "@/components/user-avatar";
import { supabaseBrowser } from "@/lib/supabase/client";

type SidebarProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

export function NavUser({
  profile,
  onNavigate,
  initialUnreadCount = 0,
}: {
  profile: SidebarProfile | null;
  onNavigate?: () => void;
  initialUnreadCount?: number;
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!profile) {
    return (
      <div className="kocteau-sidebar-expand-only kocteau-sidebar-note rounded-[0.95rem] p-3 text-[13px] leading-5 text-muted-foreground">
        <div className="mb-1.5 flex items-center gap-2 text-sidebar-foreground">
          <SparkleIcon className="size-3.5" weight="fill" />
          <span className="font-medium">Sign in to participate</span>
        </div>
        <p>
          Browse freely, then log in when you want to write reviews, save favorites, and join the conversation.
        </p>
      </div>
    );
  }

  const username = profile.username;
  const displayName = profile.display_name ?? `@${username}`;

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex w-full items-center gap-1.5 rounded-[0.75rem] group-data-[collapsible=icon]:justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-11 min-w-0 flex-1 rounded-[0.68rem] px-2 text-sidebar-foreground/78 transition-[color,background-color,width,height,padding] hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent/82 data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:grow-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                  <span className="kocteau-sidebar-avatar shrink-0">
                    <UserAvatar
                      avatarUrl={profile.avatar_url}
                      displayName={profile.display_name}
                      username={profile.username}
                      className="size-8 border-sidebar-border after:border-sidebar-border"
                    />
                  </span>
                  <div className="kocteau-sidebar-label grid flex-1 text-left text-[13px] leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">@{username}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-[0.9rem] border-border bg-popover ring-border/70"
                side="bottom"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    <UserAvatar
                      avatarUrl={profile.avatar_url}
                      displayName={profile.display_name}
                      username={profile.username}
                      className="size-8"
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">@{username}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    onNavigate?.();
                    router.push(`/u/${username}`);
                  }}
                >
                  <UserCircleIcon className="size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    onNavigate?.();
                    router.push("/saved");
                  }}
                >
                  <BookmarkSimpleIcon className="size-4" />
                  Saved reviews
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    onNavigate?.();
                    router.push("/notifications");
                  }}
                >
                  <BellSimpleIcon className="size-4" />
                  Activity
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                  <GearSixIcon className="size-4" />
                  Edit profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setLogoutOpen(true)}>
                  <SignOutIcon className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <NotificationsButton
              userId={profile.id}
              initialUnreadCount={initialUnreadCount}
              initialNotifications={[]}
              contentSide="top"
              contentAlign="end"
              contentSideOffset={7}
              contentClassName="!w-[16rem] max-w-[calc(100vw-1rem)] rounded-[0.76rem] border-sidebar-border/70 bg-sidebar p-0 sm:!w-[16rem] md:bg-sidebar"
              triggerClassName="kocteau-sidebar-trailing size-8 rounded-full border-sidebar-border/55 bg-transparent text-sidebar-foreground/52 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground md:border-sidebar-border/55 md:bg-transparent"
            />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <ProfileSettingsDialog
        profile={profile}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <WarningCircleIcon className="size-4" />
            </AlertDialogMedia>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You can keep browsing, but writing reviews and editing your profile will require signing in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={logout}>
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
