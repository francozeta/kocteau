import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { reviewIdParamsSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

type ReviewDeleteRecord = {
  id: string;
  author_id: string;
  entity_id: string;
  author:
    | {
        username: string;
      }
    | Array<{
        username: string;
      }>
    | null;
};

function getAuthorUsername(review: ReviewDeleteRecord | null) {
  if (!review?.author) {
    return null;
  }

  if (Array.isArray(review.author)) {
    return review.author[0]?.username ?? null;
  }

  return review.author.username;
}

function errorResponse(message: string, code: string | null, status: number) {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status },
  );
}

export async function DELETE(
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

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select(
      `
        id,
        author_id,
        entity_id,
        author:profiles!reviews_author_id_fkey (
          username
        )
      `,
    )
    .eq("id", reviewId)
    .maybeSingle<ReviewDeleteRecord>();

  if (reviewError) {
    return errorResponse(reviewError.message, reviewError.code ?? null, 400);
  }

  if (!review) {
    return errorResponse("Review not found", "NOT_FOUND", 404);
  }

  if (review.author_id !== auth.user.id) {
    return errorResponse("You can't delete this review.", "FORBIDDEN", 403);
  }

  const { error: notificationsError } = await supabase
    .from("notifications")
    .delete()
    .eq("review_id", reviewId);

  if (notificationsError) {
    return errorResponse(
      notificationsError.message,
      notificationsError.code ?? "DELETE_NOTIFICATIONS_FAILED",
      500,
    );
  }

  const [commentsResult, likesResult, bookmarksResult] = await Promise.all([
    supabase.from("review_comments").delete().eq("review_id", reviewId),
    supabase.from("review_likes").delete().eq("review_id", reviewId),
    supabase.from("review_bookmarks").delete().eq("review_id", reviewId),
  ]);

  if (commentsResult.error) {
    return errorResponse(
      commentsResult.error.message,
      commentsResult.error.code ?? "DELETE_COMMENTS_FAILED",
      500,
    );
  }

  if (likesResult.error) {
    return errorResponse(
      likesResult.error.message,
      likesResult.error.code ?? "DELETE_LIKES_FAILED",
      500,
    );
  }

  if (bookmarksResult.error) {
    return errorResponse(
      bookmarksResult.error.message,
      bookmarksResult.error.code ?? "DELETE_BOOKMARKS_FAILED",
      500,
    );
  }

  const { error: deleteReviewError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("author_id", auth.user.id);

  if (deleteReviewError) {
    return errorResponse(
      deleteReviewError.message,
      deleteReviewError.code ?? "DELETE_REVIEW_FAILED",
      500,
    );
  }

  const authorUsername = getAuthorUsername(review);

  revalidateTag("feed", "max");
  revalidateTag("reviews", "max");
  revalidateTag("profiles", "max");
  revalidateTag("entities", "max");
  revalidateTag(`profile:${review.author_id}:reviews`, "max");
  revalidateTag(`entity:${review.entity_id}`, "max");
  revalidateTag(`entity:${review.entity_id}:reviews`, "max");

  if (authorUsername) {
    revalidateTag(`profile:${authorUsername}`, "max");
    revalidatePath(`/u/${authorUsername}`);
  }

  revalidatePath("/");
  revalidatePath("/track");
  revalidatePath(`/track/${review.entity_id}`);
  revalidatePath("/saved");
  revalidatePath("/notifications");

  return NextResponse.json({
    ok: true,
    reviewId,
    entityId: review.entity_id,
    username: authorUsername,
  });
}
