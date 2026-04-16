import { NextResponse } from "next/server";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";
import { reviewIdParamsSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const paramsResult = reviewIdParamsSchema.safeParse(await params);

  if (!paramsResult.success) {
    return validationErrorResponse(paramsResult.error, "Invalid review id.");
  }

  const { reviewId } = paramsResult.data;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(
    rateLimits.toggleReviewLike,
    auth.user.id,
  );

  if (rateLimited) {
    return rateLimited;
  }

  const { data, error } = await supabase.rpc("toggle_review_like", {
    p_review_id: reviewId,
  });

  if (error) {
    const status =
      error.code === "42501" ? 401 : error.code === "P0002" ? 404 : 400;

    return NextResponse.json(
      { error: error.message, code: error.code ?? null },
      { status },
    );
  }

  const result = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    ok: true,
    liked: result?.liked ?? false,
    likesCount: result?.likes_count ?? 0,
  });
}
