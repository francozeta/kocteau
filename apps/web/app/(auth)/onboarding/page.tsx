import { redirect } from "next/navigation";
import AuthFormShell from "@/components/auth/auth-form-shell";
import ProfileEditorForm from "@/components/profile-editor-form";
import { createPageMetadata } from "@/lib/metadata";
import { isProfileOnboarded } from "@/lib/profile";
import { supabaseServer } from "@/lib/supabase/server";

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
    .select("username, onboarded, display_name, avatar_url, bio, spotify_url, apple_music_url, deezer_url")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileQuery.error
    ? (
        await supabase
          .from("profiles")
          .select("username, display_name, avatar_url, bio, spotify_url, apple_music_url, deezer_url")
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : profileQuery.data;

  if (isProfileOnboarded(profile)) {
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
