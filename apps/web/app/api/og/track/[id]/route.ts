import { createTrackOgImage } from "@/lib/og";
import { getTrackSummaryBundle } from "@/lib/queries/entities";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bundle = await getTrackSummaryBundle(id);

  if (!bundle) {
    return new Response("Not found", { status: 404 });
  }

  return createTrackOgImage({
    title: bundle.entity.title,
    artistName: bundle.entity.artist_name,
    coverUrl: bundle.entity.cover_url,
    reviewCount: bundle.reviewSummary.reviewCount,
    averageRating: bundle.reviewSummary.averageRating,
  });
}
