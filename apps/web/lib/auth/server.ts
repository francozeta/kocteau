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

export type CurrentOnboardingState = {
  profileOnboarded: boolean;
  tasteOnboarded: boolean;
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

export const getCurrentOnboardingState = cache(async (): Promise<CurrentOnboardingState | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await supabaseServer();
  const profileQuery = await supabase
    .from("profiles")
    .select("username, onboarded, taste_onboarded")
    .eq("id", user.id)
    .maybeSingle<{
      username: string | null;
      onboarded: boolean | null;
      taste_onboarded: boolean | null;
    }>();

  if (!profileQuery.error) {
    const profile = profileQuery.data;

    return {
      profileOnboarded: Boolean(profile?.username && profile.onboarded),
      tasteOnboarded: profile?.taste_onboarded ?? false,
    };
  }

  const fallbackQuery = await supabase
    .from("profiles")
    .select("username, onboarded")
    .eq("id", user.id)
    .maybeSingle<{
      username: string | null;
      onboarded: boolean | null;
    }>();

  const fallbackProfile = fallbackQuery.data;

  return {
    profileOnboarded: Boolean(fallbackProfile?.username && fallbackProfile.onboarded),
    tasteOnboarded: true,
  };
});
