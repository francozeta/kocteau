import { type NextRequest, NextResponse } from "next/server";
import { getPublicReviewByRouteId } from "@/lib/queries/reviews";
import { buildReviewCanonicalPath, isSeoRouteId, preserveCanonicalQuery } from "@/lib/seo-routes";

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
  const target = preserveCanonicalQuery(buildReviewCanonicalPath(review),
    Object.fromEntries(redirectUrl.searchParams));
  return NextResponse.redirect(new URL(target, redirectUrl), 308);
}
