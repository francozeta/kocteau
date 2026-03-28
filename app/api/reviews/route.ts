import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createReviewSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = createReviewSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Please review the track and rating before publishing.");
  }

  const review = parsed.data;

  const { data, error } = await supabase.rpc("create_review_with_entity", {
    p_provider: review.provider,
    p_provider_id: review.provider_id,
    p_type: review.type,
    p_title: review.title,
    p_artist_name: review.artist_name,
    p_cover_url: review.cover_url,
    p_deezer_url: review.deezer_url,
    p_review_title: review.review_title,
    p_review_body: review.review_body,
    p_rating: review.rating,
    p_is_pinned: review.is_pinned,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code ?? null },
      { status: error.code === "42501" ? 401 : 400 }
    );
  }

  const result = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({ ok: true, review: result });
}
