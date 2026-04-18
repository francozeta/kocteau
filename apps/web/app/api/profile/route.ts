import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";

type RevalidateProfilePayload = {
  previousUsername?: string | null;
  nextUsername?: string | null;
};

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(
    rateLimits.revalidateProfile,
    auth.user.id,
  );

  if (rateLimited) {
    return rateLimited;
  }

  const payload = (await req.json().catch(() => null)) as RevalidateProfilePayload | null;

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", auth.user.id)
    .maybeSingle<{ username: string | null }>();

  const usernames = new Set(
    [
      payload?.previousUsername?.trim().toLowerCase(),
      payload?.nextUsername?.trim().toLowerCase(),
      currentProfile?.username?.trim().toLowerCase(),
    ].filter((value): value is string => Boolean(value)),
  );

  revalidateTag("profiles", "max");
  revalidateTag("reviews", "max");
  revalidateTag("feed", "max");
  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/notifications");
  revalidatePath("/onboarding");

  for (const username of usernames) {
    revalidateTag(`profile:${username}`, "max");
    revalidatePath(`/u/${username}`);
  }

  return NextResponse.json({ ok: true });
}
