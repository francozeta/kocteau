import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";
import { tasteOnboardingSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

type ProfileOnboardingState = {
  onboarded: boolean | null;
  taste_onboarded: boolean | null;
};

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(
    rateLimits.saveTastePreferences,
    auth.user.id,
  );

  if (rateLimited) {
    return rateLimited;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = tasteOnboardingSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Please choose a few taste tags before continuing.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarded, taste_onboarded")
    .eq("id", auth.user.id)
    .maybeSingle<ProfileOnboardingState>();

  if (profileError) {
    return NextResponse.json(
      { error: "We could not read your profile setup state." },
      { status: 500 },
    );
  }

  if (!profile?.onboarded) {
    return NextResponse.json(
      { error: "Finish your profile before setting taste preferences.", redirectTo: "/onboarding" },
      { status: 409 },
    );
  }

  const selectedTagIds = parsed.data.tagIds;
  const { data: tags, error: tagsError } = await supabase
    .from("preference_tags")
    .select("id, kind")
    .in("id", selectedTagIds);

  if (tagsError) {
    return NextResponse.json(
      { error: "We could not validate those taste tags." },
      { status: 500 },
    );
  }

  const foundTagIds = new Set((tags ?? []).map((tag) => tag.id));

  if (foundTagIds.size !== selectedTagIds.length) {
    return NextResponse.json(
      { error: "Some taste tags are no longer available. Refresh and try again." },
      { status: 400 },
    );
  }

  const tagKindById = new Map((tags ?? []).map((tag) => [tag.id, tag.kind]));
  const rows = selectedTagIds.map((tagId) => ({
    user_id: auth.user.id,
    tag_id: tagId,
    source: "onboarding",
    weight: tagKindById.get(tagId) === "genre" ? 1.2 : 1.0,
    updated_at: new Date().toISOString(),
  }));

  const deleteResult = await supabase
    .from("user_preference_tags")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("source", "onboarding");

  if (deleteResult.error) {
    return NextResponse.json(
      { error: "We could not reset your previous taste selections." },
      { status: 500 },
    );
  }

  const insertResult = await supabase
    .from("user_preference_tags")
    .insert(rows);

  if (insertResult.error) {
    return NextResponse.json(
      { error: "We could not save your taste selections." },
      { status: 500 },
    );
  }

  const profileUpdate = await supabase
    .from("profiles")
    .update({
      taste_onboarded: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", auth.user.id);

  if (profileUpdate.error) {
    return NextResponse.json(
      { error: "We saved your selections, but could not finish onboarding." },
      { status: 500 },
    );
  }

  revalidateTag("profiles", "max");
  revalidateTag(`taste:${auth.user.id}`, "max");
  revalidatePath("/");
  revalidatePath("/onboarding/taste");

  return NextResponse.json({ ok: true, redirectTo: "/" });
}
