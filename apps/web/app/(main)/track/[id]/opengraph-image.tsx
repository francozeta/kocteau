import { notFound } from "next/navigation";
import {
  createTrackOgImage,
  ogContentType,
  ogSize,
} from "@/lib/og";
import { getTrackPublicBundle } from "@/lib/queries/entities";

export const runtime = "nodejs";
export const revalidate = 300;
export const alt = "Track preview from Kocteau";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getTrackPublicBundle(id);

  if (!bundle) {
    notFound();
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
