import { redirect } from "next/navigation";
import ReactQueryProvider from "@/app/providers/react-query-provider";
import { TasteOnboardingForm } from "@/components/auth/taste-onboarding-form";
import { createPageMetadata } from "@/lib/metadata";
import { isProfileOnboarded } from "@/lib/profile";
import { supabaseServer } from "@/lib/supabase/server";
import {
  tasteOnboardingPrimaryTagLimit,
  type PreferenceTag,
} from "@/lib/taste";

export const metadata = createPageMetadata({
  title: "Tune your taste",
  description: "Choose the first signals Kocteau should use for music recommendations.",
  path: "/onboarding/taste",
  noIndex: true,
});

export default async function TasteOnboardingPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileQuery = await supabase
    .from("profiles")
    .select("username, onboarded, taste_onboarded")
    .eq("id", user.id)
    .maybeSingle<{
      username: string | null;
      onboarded: boolean | null;
      taste_onboarded: boolean | null;
    }>();

  const profile = profileQuery.data;

  if (!isProfileOnboarded(profile)) {
    redirect("/onboarding");
  }

  if (profile?.taste_onboarded) {
    redirect("/");
  }

  const [{ data: tags }, { data: selectedTags }] = await Promise.all([
    supabase
      .from("preference_tags")
      .select("id, kind, slug, label, description, is_featured, sort_order, created_at")
      .eq("is_featured", true)
      .order("sort_order")
      .order("kind")
      .order("label")
      .limit(tasteOnboardingPrimaryTagLimit),
    supabase
      .from("user_preference_tags")
      .select("tag_id")
      .eq("user_id", user.id),
  ]);

  return (
    <ReactQueryProvider>
      <TasteOnboardingForm
        tags={(tags ?? []) as PreferenceTag[]}
        initialSelectedTagIds={(selectedTags ?? []).map((tag) => tag.tag_id)}
      />
    </ReactQueryProvider>
  );
}
