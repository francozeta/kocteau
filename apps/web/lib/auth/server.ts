import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

export type CurrentViewerProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const hasSupabaseCookie = cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (!hasSupabaseCookie) {
    return null;
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentViewerProfile = cache(async (): Promise<CurrentViewerProfile | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, display_name, bio, spotify_url, apple_music_url, deezer_url, onboarded")
    .eq("id", user.id)
    .maybeSingle<CurrentViewerProfile & { onboarded: boolean | null }>();

  if (!data?.username || !data.onboarded) {
    return null;
  }

  return data;
});
