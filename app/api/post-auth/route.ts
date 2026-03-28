import { NextResponse } from "next/server";
import { isProfileOnboarded } from "@/lib/profile";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ ok: false, redirectTo: "/login" }, { status: 401 });
  }

  const profileQuery = await supabase
    .from("profiles")
    .select("username, onboarded")
    .eq("id", auth.user.id)
    .maybeSingle();

  const profile = profileQuery.error
    ? (
        await supabase
          .from("profiles")
          .select("username")
          .eq("id", auth.user.id)
          .maybeSingle()
      ).data
    : profileQuery.data;

  const needsOnboarding = !isProfileOnboarded(profile);
  return NextResponse.json({
    ok: true,
    redirectTo: needsOnboarding ? "/onboarding" : "/",
  });
}
