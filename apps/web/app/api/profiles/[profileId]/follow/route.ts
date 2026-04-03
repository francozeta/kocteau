import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { profileIdParamsSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

function getStatusForFollowError(code: string | null | undefined) {
  if (code === "42501") {
    return 401;
  }

  if (code === "P0002") {
    return 404;
  }

  return 400;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const paramsResult = profileIdParamsSchema.safeParse(await params);

  if (!paramsResult.success) {
    return validationErrorResponse(paramsResult.error, "Invalid profile id.");
  }

  const { profileId } = paramsResult.data;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("toggle_profile_follow", {
    p_target_profile_id: profileId,
  });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.code === "42883"
            ? "Follow system isn't available yet."
            : error.message,
        code: error.code ?? null,
      },
      {
        status: error.code === "42883" ? 503 : getStatusForFollowError(error.code),
      },
    );
  }

  const result = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    ok: true,
    followerId: result?.follower_id ?? user.id,
    followingId: result?.following_id ?? profileId,
    following: result?.following ?? false,
  });
}
