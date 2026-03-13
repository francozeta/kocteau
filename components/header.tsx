"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import NewReviewDialog from "./new-review-dialog";
import { LogOut } from "lucide-react";

type HeaderProfile = {
  username: string;
  avatar_url: string | null;
  display_name: string | null;
};

export default function Header({ profile }: { profile: HeaderProfile }) {
  const supabase = supabaseBrowser();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const username = profile?.username ?? "user";
  const name = profile?.display_name ?? `@${username}`;

  return (
    <header className="border-b border-border/40 bg-background sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0 group">
          <div className="text-xl font-bold tracking-tight text-foreground group-hover:text-foreground/80 transition-colors">
            KOCTEAU
          </div>
        </Link>

        <div className="flex items-center gap-6 ml-auto">
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/" className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
              Feed
            </Link>
            <Link href="/search" className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
              Search
            </Link>
            <Link href="/track" className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
              Tracks
            </Link>
            <Link href="/settings" className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </Link>
          </nav>

          <div className="flex items-center gap-3 pl-6 border-l border-border/40">
            <Link href={`/u/${username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted border border-border/50">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={name}
                    fill
                    sizes="36px"
                    className="object-cover object-center"
                    quality={75}
                  />
                ) : null}
              </div>
              <span className="text-sm font-medium hidden sm:inline text-foreground">{name}</span>
            </Link>

            <NewReviewDialog />

            <button
              onClick={logout}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all rounded"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
