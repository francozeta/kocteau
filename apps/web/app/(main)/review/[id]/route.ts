import { type NextRequest } from "next/server";
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

  try {
    const review = await getPublicReviewByRouteId(id);

    if (!review) {
      return notFoundResponse();
    }

    const target = preserveCanonicalQuery(buildReviewCanonicalPath(review),
      Object.fromEntries(request.nextUrl.searchParams));
    return new Response(null, { status: 308, headers: { Location: target } });
  } catch {
    return new Response("This page is temporarily unavailable. Reload to retry.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "3" },
    });
  }
}
