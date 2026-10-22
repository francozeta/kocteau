import { createTrackOgImage } from "@/lib/og";
import { getEntityPageById } from "@/lib/queries/entities";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entity = await getEntityPageById(id);

  if (!entity) {
    return new Response("Not found", { status: 404 });
  }

  return createTrackOgImage({
    title: entity.title,
    artistName: entity.artist_name,
    coverUrl: entity.cover_url,
  });
}
