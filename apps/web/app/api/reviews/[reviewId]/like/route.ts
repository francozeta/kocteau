import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { trackServerAnalyticsEvent } from "@/lib/analytics/server";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";
import { reviewIdParamsSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

function getAnalyticsSource(value: unknown) {
  return typeof value === "string" && /^[a-z0-9_:-]{2,80}$/.test(value)
    ? value
    : null;
}

export async function POST(
  req: Request,
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
  const liked = result?.liked ?? false;
  const likesCount = Math.max(result?.likes_count ?? 0, liked ? 1 : 0);
  const payload = (await req.json().catch(() => null)) as
    | { source?: unknown }
    | null;
  const analyticsSource = getAnalyticsSource(payload?.source);

  if (analyticsSource === "feed:for-you") {
    await trackServerAnalyticsEvent(supabase, {
      userId: auth.user.id,
      eventType: "for_you_review_action",
      source: analyticsSource,
      metadata: {
        action: liked ? "like" : "unlike",
        review_id: reviewId,
      },
    });
  }

  revalidateTag("feed", "max");
  revalidateTag("reviews", "max");

  return NextResponse.json({
    ok: true,
    liked,
    likesCount,
  });
}
