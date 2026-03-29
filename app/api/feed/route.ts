import { NextResponse } from "next/server";
import { getFeedPageBundle } from "@/lib/queries/feed";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bundle = await getFeedPageBundle(user?.id);

  return NextResponse.json({
    feed: bundle.feed.map((review) => ({
      ...review,
      viewer_has_liked: bundle.likedReviewIds.has(review.id),
      viewer_has_bookmarked: bundle.bookmarkedReviewIds.has(review.id),
    })),
    recentTracks: bundle.recentTracks,
  });
}
