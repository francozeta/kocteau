import { type NextRequest } from "next/server";
import { getArtistPageByRouteId } from "@/lib/queries/artists";
import { buildEntityCanonicalPath, isSeoRouteId, preserveCanonicalQuery } from "@/lib/seo-routes";

export async function GET(request: NextRequest, { params }: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;
  if (!isSeoRouteId(id)) return new Response(null, { status: 404 });
  try {
    const row = await getArtistPageByRouteId(id);
    if (!row) return new Response(null, { status: 404 });
    const target = preserveCanonicalQuery(buildEntityCanonicalPath({
      id: row.id, provider: row.provider, provider_id: row.provider_id,
      type: "artist", title: row.name,
    }), Object.fromEntries(request.nextUrl.searchParams));
    return new Response(null, { status: 308, headers: { Location: target } });
  } catch {
    return new Response("This page is temporarily unavailable. Reload to retry.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "3" },
    });
  }
}
