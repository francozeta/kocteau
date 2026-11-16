import { type NextRequest } from "next/server";
import { getEntityPageByRouteId } from "@/lib/queries/entities";
import { buildEntityCanonicalPath, isSeoRouteId, preserveCanonicalQuery } from "@/lib/seo-routes";

type LegacyTrackRouteParams = {
  id: string;
};

function notFoundResponse() {
  return new Response(null, { status: 404 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<LegacyTrackRouteParams> },
) {
  const { id } = await params;

  if (!isSeoRouteId(id)) {
    return notFoundResponse();
  }

  try {
    const entity = await getEntityPageByRouteId(id);

    if (!entity) {
      return notFoundResponse();
    }

    const target = preserveCanonicalQuery(buildEntityCanonicalPath(entity),
      Object.fromEntries(request.nextUrl.searchParams));
    return new Response(null, { status: 308, headers: { Location: target } });
  } catch {
    return new Response("This page is temporarily unavailable. Reload to retry.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "3" },
    });
  }
}
