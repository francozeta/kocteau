"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bookmark, LogOut, Settings, UserRound } from "lucide-react";
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
            className="flex items-center gap-2 rounded-full border border-border/30 p-1 pr-2 transition-colors hover:bg-muted/50"
          >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  fill
                  sizes="32px"
                  className="object-cover object-center"
                  quality={75}
                />
              ) : null}
            </div>
            <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push(`/u/${username}`)}>
            <UserRound className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/saved")}>
            <Bookmark className="size-4" />
            Saved reviews
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
