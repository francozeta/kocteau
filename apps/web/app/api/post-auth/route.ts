import { NextResponse } from "next/server";
import { isProfileOnboarded } from "@/lib/profile";
import { supabaseServer } from "@/lib/supabase/server";

type PostAuthProfile = {
  username: string | null;
  onboarded: boolean | null;
  taste_onboarded: boolean | null;
};

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ ok: false, redirectTo: "/login" }, { status: 401 });
  }

  const profileQuery = await supabase
    .from("profiles")
    .select("username, onboarded, taste_onboarded")
    .eq("id", auth.user.id)
    .maybeSingle<PostAuthProfile>();

  const profile = profileQuery.error
    ? await supabase
          .from("profiles")
          .select("username, onboarded")
          .eq("id", auth.user.id)
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

  return NextResponse.json({
    ok: true,
    redirectTo: needsOnboarding
      ? "/onboarding"
      : needsTasteOnboarding
        ? "/onboarding/taste"
        : "/",
  });
}
