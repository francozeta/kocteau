import { redirect } from "next/navigation";
import AuthFormShell from "@/components/auth/auth-form-shell";
import ProfileEditorForm from "@/components/profile-editor-form";
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

export default async function OnboardingPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
      redirect("/onboarding/taste");
    }

    redirect("/");
  }

  return (
    <AuthFormShell
      title="Set up your profile"
      description="Choose a default disc or upload, crop, and save a profile photo, then set the identity people will see across Kocteau."
      widthClassName="max-w-4xl"
    >
      <ProfileEditorForm mode="onboarding" initialProfile={profile ?? undefined} />
    </AuthFormShell>
  );
}
