import { NextResponse } from "next/server";
import { getViewerReviewCollectionState, serializeReviewCollectionViewerState } from "@/lib/queries/viewer";
import { supabaseServer } from "@/lib/supabase/server";
import { reviewCollectionStateSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = reviewCollectionStateSchema.safeParse(
    await req.json().catch(() => null),
  );

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Invalid review state request.");
  }

  const viewerState = await getViewerReviewCollectionState(
    user.id,
    parsed.data.reviewIds,
  );

  return NextResponse.json(serializeReviewCollectionViewerState(viewerState));
}
