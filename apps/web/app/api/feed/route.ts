import { NextResponse } from "next/server";
import { getFeedPublicBundle, getFeedViewerState } from "@/lib/queries/feed";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const publicBundlePromise = getFeedPublicBundle();
  const userPromise = (async () => {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  })();
  const [bundle, user] = await Promise.all([publicBundlePromise, userPromise]);
  const viewerState =
    user?.id && bundle.feed.length > 0
      ? await getFeedViewerState(
          user.id,
          bundle.feed.map((review) => review.id),
        )
      : {
          likedReviewIds: new Set<string>(),
          bookmarkedReviewIds: new Set<string>(),
        };

  return NextResponse.json({
    feed: bundle.feed.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
    activeUsers: bundle.activeUsers,
  });
}
