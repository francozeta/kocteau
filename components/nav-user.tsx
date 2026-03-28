"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  Bookmark,
  ChevronsUpDown,
  LogOut,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
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

export function NavUser({ profile }: { profile: SidebarProfile | null }) {
  const { isMobile } = useSidebar();
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!profile) {
    return (
      <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-3 text-[13px] leading-5 text-muted-foreground group-data-[collapsible=icon]:hidden">
        <div className="mb-1.5 flex items-center gap-2 text-sidebar-foreground">
          <Sparkles className="size-3.5" />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="h-12 rounded-xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-sidebar-border bg-sidebar-accent">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={displayName}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="grid flex-1 text-left text-[13px] leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">@{username}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl border-border/40 bg-popover/96"
              side="bottom"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border/30 bg-muted">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={displayName}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold">
                        {displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">@{username}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push(`/u/${username}`)}>
                <UserRound className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/saved")}>
                <Bookmark className="size-4" />
                Saved reviews
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/notifications")}>
                <Bell className="size-4" />
                Activity
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                <Settings className="size-4" />
                Edit profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setLogoutOpen(true)}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <AlertCircle className="size-4" />
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
