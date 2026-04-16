import { NextResponse } from "next/server";
import { getViewerFollowingProfileIds } from "@/lib/queries/profile-follows";
import { getRecentlyActiveProfiles } from "@/lib/queries/profiles";
import { supabaseServer } from "@/lib/supabase/server";

function getLimit(req: Request) {
  const url = new URL(req.url);
  const parsedLimit = Number(url.searchParams.get("limit") ?? 4);

  if (!Number.isFinite(parsedLimit)) {
    return 4;
  }

  return Math.max(1, Math.min(Math.trunc(parsedLimit), 8));
}

export async function GET(req: Request) {
  const limit = getLimit(req);
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const candidates = (await getRecentlyActiveProfiles(limit * 2))
    .filter((profile) => profile.id !== user?.id);
  const followedProfileIds =
    user?.id && candidates.length > 0
      ? await getViewerFollowingProfileIds(
          user.id,
          candidates.map((profile) => profile.id),
        )
      : new Set<string>();

  return NextResponse.json({
    profiles: candidates
      .map((profile) => ({
        ...profile,
        viewer_is_following: followedProfileIds.has(profile.id),
      }))
      .filter((profile) => !profile.viewer_is_following)
      .slice(0, limit),
  });
}
