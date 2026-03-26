import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await params;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("toggle_review_bookmark", {
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
    reviewId: result?.review_id ?? reviewId,
    bookmarked: result?.bookmarked ?? false,
    savedAt: result?.saved_at ?? null,
  });
}
