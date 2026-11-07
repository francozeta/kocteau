import { redirect } from "next/navigation";
import ProfileOnboardingFlow from "@/components/auth/profile-onboarding-flow";
import { appendInternalNext, safeInternalPath } from "@/lib/internal-path";
import { createPageMetadata } from "@/lib/metadata";
import { isProfileOnboarded } from "@/lib/profile";
import { supabaseServer } from "@/lib/supabase/server";

type OnboardingProfile = {
  username: string | null;
  onboarded: boolean | null;
  taste_onboarded: boolean | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

export const metadata = createPageMetadata({
  title: "Set profile",
  description: "Finish your Kocteau profile setup.",
  path: "/onboarding",
  noIndex: true,
});

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeInternalPath(params.next);
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(appendInternalNext("/login", nextPath));
  }

  const profileQuery = await supabase
    .from("profiles")
    .select("username, onboarded, taste_onboarded, display_name, avatar_url, bio, spotify_url, apple_music_url, deezer_url")
    .eq("id", user.id)
    .maybeSingle<OnboardingProfile>();

  const profile = profileQuery.error
    ? await supabase
          .from("profiles")
          .select("username, onboarded, display_name, avatar_url, bio, spotify_url, apple_music_url, deezer_url")
          .eq("id", user.id)
          .maybeSingle<Omit<OnboardingProfile, "taste_onboarded">>()
          .then((fallbackQuery) =>
            fallbackQuery.data
              ? { ...fallbackQuery.data, taste_onboarded: true }
              : null,
          )
    : profileQuery.data;

  if (isProfileOnboarded(profile)) {
    if (profile?.taste_onboarded === false) {
      redirect(appendInternalNext("/onboarding/taste", nextPath));
    }

    redirect(nextPath ?? "/");
  }

  return <ProfileOnboardingFlow initialProfile={profile ?? undefined} nextPath={nextPath} />;
}
