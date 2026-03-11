"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import NewReviewDialog from "./new-review-dialog";

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
    <header className="border-b">
      <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">Kocteau</Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={name}
                  fill
                  sizes="32px"
                  className="object-cover object-center"
                  quality={75}
                />
              ) : null}
            </div>
            <Link href={`/u/${username}`} className="text-sm hover:underline">{name}</Link>
          </div>

          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
          <NewReviewDialog />
        </div>
      </div>
    </header>
  );
}
