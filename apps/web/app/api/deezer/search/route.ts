import { NextResponse } from "next/server";
import { getDeezerErrorDetails, searchDeezerTracks } from "@/lib/deezer";
import { attachSearchEntityIds } from "@/lib/search/catalog";
import { withSearchDeadline } from "@/lib/search/deadline";
import { searchReadinessHeaders } from "@/lib/search/readiness";
import { deezerSearchQuerySchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = deezerSearchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  });

  if (!parsed.success) return validationErrorResponse(parsed.error, "Search query is invalid.");
  const { q, type } = parsed.data;
  if (!q) return NextResponse.json([]);
  if (type !== "track") {
    return NextResponse.json(
      { error: "Search for " + type + " is not available in this demo yet." },
      { status: 501 },
    );
  }

  try {
    const results = await withSearchDeadline(
      (signal) => searchDeezerTracks(q, 12, { signal }),
      { signal: req.signal },
    );
    req.signal.throwIfAborted();
    const linked = await attachSearchEntityIds(results);
    req.signal.throwIfAborted();
    return NextResponse.json(linked.candidates, {
      headers: searchReadinessHeaders({
        local: "skipped", links: linked.status, provider: "fresh",
      }),
    });
  } catch (error) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error("[deezer.search] failed", {
      type, queryLength: q.length, ...getDeezerErrorDetails(error),
    });
    return NextResponse.json(
      { error: "Music search is taking longer than usual. Try again in a moment." },
      { status: 502, headers: searchReadinessHeaders({
        local: "skipped", links: "skipped", provider: "degraded",
      }) },
    );
  }
}
