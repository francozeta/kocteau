import { after, NextResponse } from "next/server";
import { requireStarterCurator } from "@/lib/curation/access";
import { prepareSourceScout, readSourceScout } from "@/lib/curation/source-scout";
import { ProposalUnavailable } from "@/lib/curation/model-runtime";
import { isDeezerProviderId } from "@/lib/deezer";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  const access = await requireStarterCurator();
  if (!access.ok) return access.response;
  const providerId = new URL(request.url).searchParams.get("provider_id") ?? "";
  const sourceClass = new URL(request.url).searchParams.get("source_class") || "editorial";
  if (!isDeezerProviderId(providerId)) return json({ error: "Choose a valid Deezer track." }, 400);
  if (sourceClass !== "editorial" && sourceClass !== "community") return json({ error: "Choose editorial or community sources." }, 400);
  try { return json(await readSourceScout(providerId, sourceClass)); }
  catch { return json({ error: "Source links could not be checked. Try again." }, 503); }
}

export async function POST(request: Request) {
  const access = await requireStarterCurator();
  if (!access.ok) return access.response;
  const body: unknown = await request.json().catch(() => null);
  const providerId = body && typeof body === "object" && "provider_id" in body ? body.provider_id : null;
  const sourceClass = body && typeof body === "object" && "source_class" in body ? body.source_class : "editorial";
  if (typeof providerId !== "string" || !isDeezerProviderId(providerId)) return json({ error: "Choose a valid Deezer track." }, 400);
  if (sourceClass !== "editorial" && sourceClass !== "community") return json({ error: "Choose editorial or community sources." }, 400);
  const limit = await checkRateLimit({ name: "curation:source-scout", limit: 3, windowMs: 5 * 60_000 }, access.user.id);
  if (!limit.enabled) return json({ error: "Source lookup is unavailable. Try again later." }, 503);
  if (!limit.ok) return rateLimitResponse(limit);
  try {
    const prepared = await prepareSourceScout(providerId, access.user.id, sourceClass);
    if (prepared.run) after(prepared.run);
    return json({ id: prepared.id }, prepared.run ? 202 : 200);
  } catch (error) {
    if (error instanceof ProposalUnavailable) {
      if (error.code === "needs_research") return json({ error: "Finish catalog research first. Source lookup needs a missing mood, scene, or style." }, 409);
      if (error.code === "limit") return json({ error: "The shared research allowance is unavailable. Continue curating manually or try later." }, 429);
      if (error.code === "model_auth") return json({ error: "Model access is unavailable. Check the server-only API key, then try again." }, 503);
      if (error.code === "storage") return json({ error: "Research storage is unavailable. Continue curating manually." }, 503);
    }
    return json({ error: "Source lookup could not start. Check research configuration or try again later." }, 503);
  }
}
