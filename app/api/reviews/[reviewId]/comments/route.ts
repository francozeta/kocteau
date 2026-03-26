import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type CommentPayload = {
  body?: string;
  parent_id?: string | null;
};

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("review_comments")
    .select(`
      id,
      review_id,
      author_id,
      parent_id,
      body,
      created_at,
      updated_at,
      author:profiles!review_comments_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("review_id", reviewId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code ?? null },
      { status: error.code === "42P01" ? 503 : 400 },
    );
  }

  return NextResponse.json({
    comments: (data ?? []).map((comment) => ({
      ...comment,
      is_owner: Boolean(user?.id && comment.author_id === user.id),
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await params;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as CommentPayload | null;
  const body = payload?.body?.trim();

  if (!body) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }

  if (payload?.parent_id) {
    return NextResponse.json(
      { error: "Replies are not enabled yet" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("review_comments")
    .insert({
      review_id: reviewId,
      author_id: auth.user.id,
      parent_id: null,
      body,
    })
    .select(`
      id,
      review_id,
      author_id,
      parent_id,
      body,
      created_at,
      updated_at,
      author:profiles!review_comments_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code ?? null },
      { status: error.code === "42P01" ? 503 : error.code === "42501" ? 401 : 400 },
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
    commentsCount,
    comment: {
      ...data,
      is_owner: true,
    },
  });
}
