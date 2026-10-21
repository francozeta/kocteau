import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/search/catalog";
import { kocteauSearchQuerySchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = kocteauSearchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    source: searchParams.get("source") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Search query is invalid.");
  }

  const { q, type, source } = parsed.data;
  if (!q) return NextResponse.json([]);

  const { results, hasProviderError } = await searchCatalog(q, type, source);
  if (!results.length && hasProviderError) {
    console.error("[search.catalog] failed with no fallback", { queryLength: q.length, type, source });
    return NextResponse.json(
      { error: "Music search is taking longer than usual. Try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json(results);
}
