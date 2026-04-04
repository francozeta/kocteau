import { createTrackOgImage } from "@/lib/og";
import { getTrackPublicBundle } from "@/lib/queries/entities";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bundle = await getTrackPublicBundle(id);

  if (!bundle) {
    return new Response("Not found", { status: 404 });
  }

  const averageRating =
    bundle.reviews.length > 0
      ? bundle.reviews.reduce((sum, review) => sum + review.rating, 0) /
        bundle.reviews.length
      : null;

  return createTrackOgImage({
    title: bundle.entity.title,
    artistName: bundle.entity.artist_name,
    coverUrl: bundle.entity.cover_url,
    reviewCount: bundle.reviews.length,
    averageRating,
  });
}
