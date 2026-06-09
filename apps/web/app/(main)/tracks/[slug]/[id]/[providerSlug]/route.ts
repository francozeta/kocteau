import { type NextRequest, NextResponse } from "next/server";
import { getEntityPageByProvider } from "@/lib/queries/entities";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";

type ProviderTrackRouteParams = {
  slug: string;
  id: string;
  providerSlug: string;
};

function notFoundResponse() {
  return new Response(null, { status: 404 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<ProviderTrackRouteParams> },
) {
  const { slug: provider, id: providerId } = await params;
  const entity = await getEntityPageByProvider(provider, "track", providerId);

  if (!entity) {
    return notFoundResponse();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = buildEntityCanonicalPath(entity);
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl, 308);
}
