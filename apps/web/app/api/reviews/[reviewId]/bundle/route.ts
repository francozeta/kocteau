import { NextResponse } from "next/server";
import { getReviewPageBundle } from "@/lib/queries/reviews";
import { supabaseServer } from "@/lib/supabase/server";
import { reviewIdParamsSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const paramsResult = reviewIdParamsSchema.safeParse(await params);

  if (!paramsResult.success) {
    return validationErrorResponse(paramsResult.error, "Invalid review id.");
  }

  const { reviewId } = paramsResult.data;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bundle = await getReviewPageBundle(reviewId, user?.id);

  if (!bundle) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  return NextResponse.json({
    review: {
      ...bundle.review,
      viewer_has_liked: bundle.liked,
      viewer_has_bookmarked: bundle.bookmarked,
    },
  });
}
