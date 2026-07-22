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

type CurrentViewerContext = Omit<CurrentViewerProfile, "username"> & {
  username: string | null;
  onboarded: boolean | null;
  taste_onboarded: boolean | null;
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

const getCurrentViewerContext = cache(async (): Promise<CurrentViewerContext | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await supabaseServer();
  const profileQuery = await supabase
    .from("profiles")
    .select("id, username, avatar_url, display_name, bio, spotify_url, apple_music_url, deezer_url, onboarded, taste_onboarded")
    .eq("id", user.id)
    .maybeSingle<CurrentViewerContext>();

  if (!profileQuery.error) {
    return profileQuery.data;
  }

  const fallbackQuery = await supabase
    .from("profiles")
    .select("id, username, avatar_url, display_name, bio, spotify_url, apple_music_url, deezer_url, onboarded")
    .eq("id", user.id)
    .maybeSingle<Omit<CurrentViewerContext, "taste_onboarded">>();

  return fallbackQuery.data
    ? { ...fallbackQuery.data, taste_onboarded: true }
    : null;
});

export const getCurrentViewerProfile = cache(async (): Promise<CurrentViewerProfile | null> => {
  const profile = await getCurrentViewerContext();

  if (!profile?.username || !profile.onboarded) {
    return null;
  }

  return {
    id: profile.id,
    username: profile.username,
    avatar_url: profile.avatar_url,
    display_name: profile.display_name,
    bio: profile.bio,
    spotify_url: profile.spotify_url,
    apple_music_url: profile.apple_music_url,
    deezer_url: profile.deezer_url,
  };
});

export const getCurrentOnboardingState = cache(async (): Promise<CurrentOnboardingState | null> => {
  const profile = await getCurrentViewerContext();

  if (!profile) {
    return null;
  }

  return {
    profileOnboarded: Boolean(profile.username && profile.onboarded),
    tasteOnboarded: profile.taste_onboarded ?? false,
  };
});
