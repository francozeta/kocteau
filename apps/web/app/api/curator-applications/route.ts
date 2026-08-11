import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";
import { curatorApplicationSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(
    rateLimits.createCuratorApplication,
    user.id,
  );

  if (rateLimited) {
    return rateLimited;
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = curatorApplicationSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Please review your application.");
  }

  const { data, error } = await supabase
    .from("curator_applications")
    .insert({
      user_id: user.id,
      taste_focus: parsed.data.taste_focus,
      motivation: parsed.data.motivation,
      sample_links: parsed.data.sample_links,
      availability: parsed.data.availability,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already have an active curator application." },
        { status: 409 },
      );
    }

    console.error("[curator-applications.create] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
      userId: user.id,
    });

    return NextResponse.json(
      { error: "We could not submit your application. Please try again." },
      { status: error.code === "42501" ? 403 : 500 },
    );
  }

  revalidatePath("/curators");
  revalidatePath("/studio/curators");

  return NextResponse.json({ application: data }, { status: 201 });
}
