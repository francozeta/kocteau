import { type NextRequest, NextResponse } from "next/server";
import { getPublicReviewByRouteId } from "@/lib/queries/reviews";
import { buildReviewCanonicalPath, isSeoRouteId, preserveCanonicalQuery } from "@/lib/seo-routes";

export async function GET(request: NextRequest, { params }: {
  params: Promise<{ reviewId: string; slug: string }>;
}) {
  const { reviewId } = await params;
  if (!isSeoRouteId(reviewId)) return new Response(null, { status: 404 });
  try {
    const row = await getPublicReviewByRouteId(reviewId);
    if (!row) return new Response(null, { status: 404 });
    const target = preserveCanonicalQuery(buildReviewCanonicalPath(row), Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.redirect(new URL(target, request.url), 308);
  } catch {
    return new Response("This page is temporarily unavailable. Reload to retry.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "3" },
    });
  }
}
