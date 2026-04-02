import { NextResponse } from "next/server";
import { getTrackPublicBundle, getTrackViewerState } from "@/lib/queries/entities";
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
  const publicBundlePromise = getTrackPublicBundle(id);
  const userPromise = (async () => {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  })();
  const [bundle, user] = await Promise.all([publicBundlePromise, userPromise]);

  if (!bundle) {
    return NextResponse.json({ error: "Track not found." }, { status: 404 });
  }

  const viewerState =
    user?.id && bundle.reviews.length > 0
      ? await getTrackViewerState(user.id, id, bundle.reviews)
      : {
          likedReviewIds: new Set<string>(),
          bookmarkedReviewIds: new Set<string>(),
          viewerReviewId: null as string | null,
        };

  return NextResponse.json({
    entity: bundle.entity,
    viewerReviewId: viewerState.viewerReviewId,
    reviews: bundle.reviews.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
  });
}
