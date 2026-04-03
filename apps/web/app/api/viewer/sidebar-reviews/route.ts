import { NextResponse } from "next/server";
import { getOwnedSidebarReviews } from "@/lib/queries/reviews";
import { supabaseServer } from "@/lib/supabase/server";
import type { SidebarOwnedReview } from "@/lib/types/sidebar";

function mapSidebarReviews(
  reviews: Awaited<ReturnType<typeof getOwnedSidebarReviews>>,
) {
  return reviews.flatMap((review) => {
    const entity = Array.isArray(review.entities)
      ? review.entities[0] ?? null
      : review.entities;

    if (
      !entity ||
      entity.provider !== "deezer" ||
      !entity.provider_id ||
      entity.type !== "track"
    ) {
      return [];
    }

    return [{
      id: review.id,
      title: review.title,
      body: review.body,
      rating: review.rating,
      is_pinned: Boolean(review.is_pinned),
      entity: {
        provider: "deezer" as const,
        provider_id: entity.provider_id,
        type: "track" as const,
        title: entity.title,
        artist_name: entity.artist_name,
        cover_url: entity.cover_url,
        deezer_url: entity.deezer_url,
        entity_id: entity.id,
      },
    }] satisfies SidebarOwnedReview[];
  });
}

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const reviews = await getOwnedSidebarReviews(user.id, 4);

  return NextResponse.json({
    reviews: mapSidebarReviews(reviews),
  });
}
