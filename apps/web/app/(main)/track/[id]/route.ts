import { type NextRequest, NextResponse } from "next/server";
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

  const entity = await getEntityPageByRouteId(id);

  if (!entity) {
    return notFoundResponse();
  }

  const redirectUrl = request.nextUrl.clone();
  const target = preserveCanonicalQuery(buildEntityCanonicalPath(entity),
    Object.fromEntries(redirectUrl.searchParams));
  return NextResponse.redirect(new URL(target, redirectUrl), 308);
}
