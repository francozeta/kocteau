import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { classifyAuthClaims } from "@/lib/auth/claims-policy";
import {
  isLegacyTasteOnboardedColumnError,
  VIEWER_CONTEXT_READ_BUDGET_MS,
} from "@/lib/auth/viewer-context-policy";

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

export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const hasSupabaseCookie = cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (!hasSupabaseCookie) {
    return null;
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getClaims();
  const outcome = classifyAuthClaims(data?.claims?.sub, error);

  // An Auth 5xx / network failure is not proof of logout. Fail closed with a
  // recoverable route error instead of redirecting to the marketing landing.
  if (outcome === "unavailable") {
    throw new Error("Authentication temporarily unavailable");
  }

  return outcome === "authenticated" ? data?.claims?.sub ?? null : null;
});

const getCurrentViewerContext = cache(async (): Promise<CurrentViewerContext | null> => {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const supabase = await supabaseServer();
  // One deadline shared by the primary query and the legacy-schema fallback:
  // an unavailable origin must never cause two sequential slow reads.
  const deadline = AbortSignal.timeout(VIEWER_CONTEXT_READ_BUDGET_MS);
  const profileQuery = await supabase
    .from("profiles")
    .select("id, username, avatar_url, display_name, bio, spotify_url, apple_music_url, deezer_url, onboarded, taste_onboarded")
    .eq("id", userId)
    .abortSignal(deadline)
    .maybeSingle<CurrentViewerContext>();

  if (!profileQuery.error) {
    return profileQuery.data;
  }

  // Only a genuinely absent legacy column needs a second SQL shape.
  // Transport failures must not turn into doubled origin work.
  if (!isLegacyTasteOnboardedColumnError(profileQuery.error) || deadline.aborted) {
    console.warn("[auth.viewerContext] unavailable", { code: profileQuery.error.code ?? null });
    return null;
  }

  const fallbackQuery = await supabase
    .from("profiles")
    .select("id, username, avatar_url, display_name, bio, spotify_url, apple_music_url, deezer_url, onboarded")
    .eq("id", userId)
    .abortSignal(deadline)
    .maybeSingle<Omit<CurrentViewerContext, "taste_onboarded">>();

  if (fallbackQuery.error) {
    console.warn("[auth.viewerContext] fallback unavailable", { code: fallbackQuery.error.code ?? null });
    return null;
  }

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
