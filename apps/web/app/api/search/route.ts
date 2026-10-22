import { NextResponse } from "next/server";
import { measureServerTask } from "@/lib/perf";
import { searchReadinessHeaders } from "@/lib/search/readiness";
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

  return measureServerTask("catalog.search", async () => {
    const startedAt = performance.now();
    try {
      const { results, hasProviderError, readiness, timings } = await searchCatalog(q, type, source, {
        signal: req.signal,
      });
      const headers = {
        ...searchReadinessHeaders(readiness),
        "Server-Timing": Object.entries({
          ...timings,
          total: performance.now() - startedAt,
        }).map(([name, duration]) => `${name};dur=${duration.toFixed(1)}`).join(", "),
      };

      if (!results.length && (hasProviderError || readiness.local === "degraded")) {
        console.error("[search.catalog] failed with no fallback", { queryLength: q.length, type, source });
        return NextResponse.json(
          { error: "Music search is taking longer than usual. Try again in a moment." },
          { status: 502, headers },
        );
      }
      return NextResponse.json(results, { headers });
    } catch (error) {
      if (req.signal.aborted) return new Response(null, { status: 499 });
      throw error;
    }
  }, { scope: type, source });
}
