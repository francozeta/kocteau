import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { normalizeRelation } from "@/lib/queries/normalize-relation";
import { supabaseServer } from "@/lib/supabase/server";
import { reviewIdParamsSchema, updateReviewSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

type ReviewDeleteRecord = {
  id: string;
  author_id: string;
  entity_id: string;
  author: {
    username: string;
  } | null;
};

function getAuthorUsername(review: ReviewDeleteRecord | null) {
  return review?.author?.username ?? null;
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

function logReviewMutationError(
  action: "update" | "delete",
  error: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  },
  context: {
    reviewId: string;
    userId: string;
  },
) {
  console.error(`[reviews.${action}] failed`, {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    context,
  });
}

function revalidateReviewSurfaces(review: ReviewDeleteRecord, reviewId: string) {
  const authorUsername = getAuthorUsername(review);

  revalidateTag("feed", "max");
  revalidateTag("reviews", "max");
  revalidateTag("profiles", "max");
  revalidateTag("entities", "max");
  revalidateTag(`review:${reviewId}`, "max");
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

  return authorUsername;
}

async function getOwnedReviewRecord(
  reviewId: string,
  userId: string,
) {
  const supabase = await supabaseServer();
  const { data, error: reviewError } = await supabase
    .from("reviews")
    .select(
      `
        id,
        author_id,
        entity_id,
        title,
        body,
        rating,
        is_pinned,
        author:profiles!reviews_author_id_fkey (
          username
        )
      `,
    )
    .eq("id", reviewId)
    .maybeSingle<ReviewDeleteRecord & {
      title?: string | null;
      body?: string | null;
      rating?: number;
      is_pinned?: boolean;
    }>();

  const review = data
    ? {
        ...data,
        author: normalizeRelation(data.author),
      }
    : null;

  if (reviewError) {
    return { supabase, review: null, error: reviewError };
  }

  if (!review) {
    return {
      supabase,
      review: null,
      error: {
        code: "NOT_FOUND",
        message: "Review not found",
      },
    };
  }

  if (review.author_id !== userId) {
    return {
      supabase,
      review: null,
      error: {
        code: "FORBIDDEN",
        message: "You can't edit this review.",
      },
    };
  }

  return {
    supabase,
    review,
    error: null,
  };
}

export async function PATCH(
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

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = updateReviewSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Please review the rating and fields before saving.");
  }

  const reviewLookup = await getOwnedReviewRecord(reviewId, auth.user.id);
  const reviewError = reviewLookup.error;

  if (reviewError) {
    const status =
      reviewError.code === "NOT_FOUND"
        ? 404
        : reviewError.code === "FORBIDDEN"
          ? 403
          : 400;

    return errorResponse(
      reviewError.message ?? "Review unavailable",
      reviewError.code ?? null,
      status,
    );
  }

  const { review } = reviewLookup;

  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      title: parsed.data.review_title,
      body: parsed.data.review_body,
      rating: parsed.data.rating,
      is_pinned: parsed.data.is_pinned,
    })
    .eq("id", reviewId)
    .eq("author_id", auth.user.id);

  if (updateError) {
    logReviewMutationError("update", updateError, {
      reviewId,
      userId: auth.user.id,
    });

    return errorResponse(
      "We couldn't update this review right now.",
      "UPDATE_REVIEW_FAILED",
      500,
    );
  }

  const authorUsername = revalidateReviewSurfaces(review, reviewId);

  return NextResponse.json({
    ok: true,
    reviewId,
    entityId: review.entity_id,
    username: authorUsername,
  });
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

  const reviewLookup = await getOwnedReviewRecord(reviewId, auth.user.id);
  const reviewError = reviewLookup.error;

  if (reviewError) {
    const status =
      reviewError.code === "NOT_FOUND"
        ? 404
        : reviewError.code === "FORBIDDEN"
          ? 403
          : 400;

    return errorResponse(
      reviewError.message ?? "Review unavailable",
      reviewError.code ?? null,
      status,
    );
  }

  const review = reviewLookup.review as ReviewDeleteRecord;

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
    logReviewMutationError("delete", deleteReviewError, {
      reviewId,
      userId: auth.user.id,
    });

    return errorResponse(
      "We couldn't delete this review right now.",
      "DELETE_REVIEW_FAILED",
      500,
    );
  }

  const authorUsername = revalidateReviewSurfaces(review, reviewId);

  return NextResponse.json({
    ok: true,
    reviewId,
    entityId: review.entity_id,
    username: authorUsername,
  });
}
