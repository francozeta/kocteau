import { NextResponse } from "next/server";
import { getTrackPageBundle } from "@/lib/queries/entities";
import { supabaseServer } from "@/lib/supabase/server";
import { entityIdParamsSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const paramsResult = entityIdParamsSchema.safeParse(await params);

  if (!paramsResult.success) {
    return validationErrorResponse(paramsResult.error, "Invalid track id.");
  }

  const { id } = paramsResult.data;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bundle = await getTrackPageBundle(id, user?.id);

  if (!bundle) {
    return NextResponse.json({ error: "Track not found." }, { status: 404 });
  }

  return NextResponse.json({
    entity: bundle.entity,
    viewerReviewId: bundle.viewerReviewId,
    reviews: bundle.reviews.map((review) => ({
      ...review,
      viewer_has_liked: bundle.likedReviewIds.has(review.id),
      viewer_has_bookmarked: bundle.bookmarkedReviewIds.has(review.id),
    })),
  });
}
