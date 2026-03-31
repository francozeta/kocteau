"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bell, Bookmark, LogOut, Settings, UserRound } from "lucide-react";
import UserAvatar from "@/components/user-avatar";
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
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import { supabaseBrowser } from "@/lib/supabase/client";

type HeaderUserMenuProps = {
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    display_name: string | null;
    bio: string | null;
    spotify_url: string | null;
    apple_music_url: string | null;
    deezer_url: string | null;
  };
};

export default function HeaderUserMenu({ profile }: HeaderUserMenuProps) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const username = profile.username;
  const displayName = profile.display_name ?? `@${username}`;

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-border/40 bg-background/65 p-1 pr-2 transition-colors hover:bg-muted/40"
          >
            <UserAvatar
              avatarUrl={profile.avatar_url}
              displayName={profile.display_name}
              username={profile.username}
              className="size-8"
            />
            <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
              {displayName}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60 rounded-2xl border-border/40 bg-popover/96 p-1.5">
          <DropdownMenuLabel className="px-2 py-2">
            <div className="space-y-0.5">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">@{username}</p>
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
            Notifications
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
              You will still be able to browse the app, but creating reviews and editing your
              profile will require signing in again.
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
