import { after, NextResponse } from "next/server";
import { requireStarterCurator } from "@/lib/curation/access";
import { isDeezerProviderId } from "@/lib/deezer";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { ensureCatalogResearch, readCatalogResearch } from "@/lib/catalog/research";
import { processCatalogResearchJob } from "@/lib/catalog/enrichment";
import { canRunCatalogResearch } from "@/lib/catalog/research-state";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  const access = await requireStarterCurator();
  if (!access.ok) return access.response;
  const providerId = new URL(request.url).searchParams.get("provider_id") ?? "";
  if (!isDeezerProviderId(providerId)) return json({ error: "Choose a valid Deezer track." }, 400);
  try {
    return json(await readCatalogResearch(providerId));
  } catch {
    return json({ error: "Catalog research is unavailable. Try again later." }, 503);
  }
}

export async function POST(request: Request) {
  const deadline = Date.now() + 50_000;
  const access = await requireStarterCurator();
  if (!access.ok) return access.response;
  const body: unknown = await request.json().catch(() => null);
  const providerId = body && typeof body === "object" && "provider_id" in body ? body.provider_id : null;
  if (typeof providerId !== "string" || !isDeezerProviderId(providerId)) {
    return json({ error: "Choose a valid Deezer track." }, 400);
  }
  const limit = await checkRateLimit({ name: "catalog:research", limit: 12, windowMs: 5 * 60_000 }, access.user.id);
  if (!limit.enabled) return json({ error: "Catalog research is unavailable. Try again later." }, 503);
  if (!limit.ok) return rateLimitResponse(limit);
  try {
    const research = await ensureCatalogResearch(providerId);
    if (!research) return json({ error: "This track is no longer available from Deezer." }, 404);
    if (research.job && canRunCatalogResearch(research)) {
      const jobId = research.job.id;
      after(async () => {
        try {
          await processCatalogResearchJob(jobId, deadline);
        } catch {
          console.error("[catalog.research] worker interrupted; queued work will resume through cron");
        }
      });
    }
    return json(research, research.job?.status === "complete" ? 200 : 202);
  } catch {
    return json({ error: "Catalog research could not start. Try again later." }, 503);
  }
}
