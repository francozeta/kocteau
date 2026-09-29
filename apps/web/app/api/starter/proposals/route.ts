import { after, NextResponse } from "next/server";
import { requireStarterCurator } from "@/lib/curation/access";
import { prepareEditorialProposal, readEditorialProposal, ProposalUnavailable } from "@/lib/curation/proposals";
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
  if (!isDeezerProviderId(providerId)) return json({ error: "Choose a valid Deezer track." }, 400);
  try {
    return json(await readEditorialProposal(providerId));
  } catch {
    return json({ error: "Suggestions are unavailable. Try again later." }, 503);
  }
}

export async function POST(request: Request) {
  const access = await requireStarterCurator();
  if (!access.ok) return access.response;
  const body: unknown = await request.json().catch(() => null);
  const providerId = body && typeof body === "object" && "provider_id" in body ? body.provider_id : null;
  if (typeof providerId !== "string" || !isDeezerProviderId(providerId)) return json({ error: "Choose a valid Deezer track." }, 400);
  const limit = await checkRateLimit({ name: "curation:proposals", limit: 5, windowMs: 5 * 60_000 }, access.user.id);
  if (!limit.enabled) return json({ error: "Suggestions are unavailable. Try again later." }, 503);
  if (!limit.ok) return rateLimitResponse(limit);
  try {
    const prepared = await prepareEditorialProposal(providerId, access.user.id);
    if (prepared.run) after(prepared.run);
    return json({ id: prepared.id }, prepared.run ? 202 : 200);
  } catch (error) {
    if (error instanceof ProposalUnavailable) {
      if (error.code === "needs_research") return json({ error: "Finish source research before preparing suggestions." }, 409);
      if (error.code === "limit") return json({ error: "The suggestion allowance is unavailable. Your draft is unchanged; try again later." }, 429);
      if (error.code === "gateway_auth") return json({ error: "Gateway access expired or is unavailable. Refresh local OIDC or configure a server-only key." }, 503);
      if (error.code === "storage") return json({ error: "Proposal storage is unavailable. Your draft is unchanged." }, 503);
    }
    return json({ error: "Context could not start. Continue curating manually or try again later." }, 503);
  }
}
