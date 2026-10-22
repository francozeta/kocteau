import { notFound } from "next/navigation";
import {
  createTrackOgImage,
  ogContentType,
  ogSize,
} from "@/lib/og";
import { getEntityPageById } from "@/lib/queries/entities";

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
  const entity = await getEntityPageById(id);

  if (!entity) {
    notFound();
  }

  return createTrackOgImage({
    title: entity.title,
    artistName: entity.artist_name,
    coverUrl: entity.cover_url,
  });
}
