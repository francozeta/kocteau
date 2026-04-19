import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isProfileOnboarded } from "@/lib/profile";
import type { Database } from "@/lib/supabase/database.types";

export type PostAuthProfile = {
  username: string | null;
  onboarded: boolean | null;
  taste_onboarded: boolean | null;
};

export async function getPostAuthRedirect(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const profileQuery = await supabase
    .from("profiles")
    .select("username, onboarded, taste_onboarded")
    .eq("id", userId)
    .maybeSingle<PostAuthProfile>();

  const profile = profileQuery.error
    ? await supabase
        .from("profiles")
        .select("username, onboarded")
        .eq("id", userId)
        .maybeSingle<Omit<PostAuthProfile, "taste_onboarded">>()
        .then((fallbackQuery) =>
          fallbackQuery.data
            ? { ...fallbackQuery.data, taste_onboarded: true }
            : null,
        )
    : profileQuery.data;

  const needsOnboarding = !isProfileOnboarded(profile);
  const needsTasteOnboarding =
    !needsOnboarding && profile?.taste_onboarded === false;

  if (needsOnboarding) {
    return "/onboarding";
  }

  if (needsTasteOnboarding) {
    return "/onboarding/taste";
  }

  return "/";
}
