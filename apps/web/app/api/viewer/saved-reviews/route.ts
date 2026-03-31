import { NextResponse } from "next/server";
import { getViewerSavedReviewsBundle } from "@/lib/queries/viewer";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const bundle = await getViewerSavedReviewsBundle(user.id);

  return NextResponse.json({
    reviews: bundle.reviews,
  });
}
