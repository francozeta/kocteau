"use client";

import Link from "next/link";
import NewReviewDialog from "./new-review-dialog";
import ProfileSettingsDialog from "./profile-settings-dialog";
import HeaderUserMenu from "./header-user-menu";
import { Button } from "@/components/ui/button";

type HeaderProfile = {
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

export default function Header({ profile }: { profile: HeaderProfile | null }) {
  return (
    <header className="border-b border-border/30 bg-background/95 sticky top-0 z-50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0 group">
          <div className="text-lg font-serif font-bold tracking-tight text-foreground group-hover:text-foreground/70 transition-colors">
            K
          </div>
        </Link>

        <div className="flex items-center gap-4 ml-auto">
          <nav className="hidden md:flex items-center gap-0.5 text-sm">
            <Link href="/" className="px-2.5 py-2 text-muted-foreground hover:text-foreground transition-colors">
              Feed
            </Link>
            <Link href="/search" className="px-2.5 py-2 text-muted-foreground hover:text-foreground transition-colors">
              Search
            </Link>
            <Link href="/track" className="px-2.5 py-2 text-muted-foreground hover:text-foreground transition-colors">
              Tracks
            </Link>
            {profile ? (
              <ProfileSettingsDialog
                profile={profile}
                trigger={
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-2.5">
                    Settings
                  </Button>
                }
              />
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <NewReviewDialog isAuthenticated={Boolean(profile)} />
            {profile ? (
              <HeaderUserMenu profile={profile} />
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
