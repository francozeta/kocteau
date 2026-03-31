import "server-only";

import { cache } from "react";
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
    .select("id, username, avatar_url, display_name, bio, spotify_url, apple_music_url, deezer_url")
    .eq("id", user.id)
    .maybeSingle<CurrentViewerProfile>();

  return (
    data ?? {
      id: user.id,
      username: "user",
      avatar_url: null,
      display_name: null,
      bio: null,
      spotify_url: null,
      apple_music_url: null,
      deezer_url: null,
    }
  );
});
