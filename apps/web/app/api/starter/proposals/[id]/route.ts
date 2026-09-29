import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStarterCurator } from "@/lib/curation/access";
import { readEditorialProposalById } from "@/lib/curation/proposals";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireStarterCurator();
  if (!access.ok) return access.response;
  const { id } = await params;
  const headers = { "Cache-Control": "private, no-store" };
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid suggestion ID." }, { status: 400, headers });
  try {
    const proposal = await readEditorialProposalById(id);
    return NextResponse.json(proposal ?? { error: "Suggestions not found." }, { status: proposal ? 200 : 404, headers });
  } catch {
    return NextResponse.json({ error: "Suggestions are unavailable." }, { status: 503, headers });
  }
}
