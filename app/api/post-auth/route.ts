import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ ok: false, redirectTo: "/login" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", auth.user.id)
    .single();

  const needsOnboarding = !profile?.username || profile.username.startsWith("u_");
  return NextResponse.json({
    ok: true,
    redirectTo: needsOnboarding ? "/onboarding" : "/",
  });
}