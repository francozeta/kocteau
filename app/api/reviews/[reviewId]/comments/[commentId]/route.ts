import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { reviewCommentParamsSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

type ReconcileResult = {
  review_id: string;
  comments_count: number;
};

async function getCommentsCountFallback(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  reviewId: string,
) {
  const { count, error } = await supabase
    .from("review_comments")
    .select("id", { count: "exact", head: true })
    .eq("review_id", reviewId);

  if (error) {
    return { commentsCount: 0, error };
  }

  return { commentsCount: count ?? 0, error: null };
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ reviewId: string; commentId: string }> },
) {
  const paramsResult = reviewCommentParamsSchema.safeParse(await params);

  if (!paramsResult.success) {
    return validationErrorResponse(paramsResult.error, "Invalid comment request.");
  }

  const { reviewId, commentId } = paramsResult.data;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: deletedComment, error } = await supabase
    .from("review_comments")
    .delete()
    .select("id, review_id")
    .eq("id", commentId)
    .eq("review_id", reviewId)
    .eq("author_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code ?? null },
      { status: error.code === "42P01" ? 503 : error.code === "42501" ? 401 : 400 },
    );
  }

  if (!deletedComment) {
    return NextResponse.json(
      { error: "Comment not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const { data: reconciled, error: reconcileError } = await supabase.rpc(
    "reconcile_review_comments_count",
    {
      p_review_id: reviewId,
    },
  );

  let commentsCount = 0;

  if (reconcileError) {
    const isFunctionMissing =
      reconcileError.code === "42883" ||
      reconcileError.message.includes("reconcile_review_comments_count");

    if (!isFunctionMissing) {
      return NextResponse.json(
        { error: reconcileError.message, code: reconcileError.code ?? null },
        { status: reconcileError.code === "42P01" ? 503 : 500 },
      );
    }

    const fallback = await getCommentsCountFallback(supabase, reviewId);

    if (fallback.error) {
      return NextResponse.json(
        { error: fallback.error.message, code: fallback.error.code ?? null },
        { status: fallback.error.code === "42P01" ? 503 : 500 },
      );
    }

    commentsCount = fallback.commentsCount;
  }

  const reconcileResult = Array.isArray(reconciled)
    ? (reconciled[0] as ReconcileResult | undefined)
    : ((reconciled as ReconcileResult | null) ?? undefined);

  if (!reconcileError) {
    commentsCount = reconcileResult?.comments_count ?? 0;
  }

  return NextResponse.json({
    ok: true,
    reviewId,
    commentId: deletedComment.id,
    commentsCount,
  });
}
