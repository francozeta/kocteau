import { type NextRequest, NextResponse } from "next/server";
import { getPublicReviewByRouteId } from "@/lib/queries/reviews";
import { buildReviewCanonicalPath, isSeoRouteId } from "@/lib/seo-routes";

type LegacyReviewRouteParams = {
  id: string;
};

function notFoundResponse() {
  return new Response(null, { status: 404 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<LegacyReviewRouteParams> },
) {
  const { id } = await params;

  if (!isSeoRouteId(id)) {
    return notFoundResponse();
  }

  const review = await getPublicReviewByRouteId(id);

  if (!review) {
    return notFoundResponse();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = buildReviewCanonicalPath(review);
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl, 308);
}
