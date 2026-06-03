import { NextResponse } from "next/server";
import { requireStarterCurator } from "@/lib/curation/access";
import {
  editorialCandidateDecisionSchema,
  editorialCandidateListQuerySchema,
  editorialCandidateUpsertSchema,
} from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

function editorialCandidateErrorResponse(error: {
  code?: string | null;
  message?: string | null;
}) {
  if (error.code === "42501") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  if (error.code === "02000") {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      error:
        error.message ?? "We could not update the editorial candidate queue.",
    },
    { status: 500 },
  );
}

export async function GET(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const { searchParams } = new URL(req.url);
  const parsed = editorialCandidateListQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Candidate queue query is invalid.");
  }

  const { status, limit } = parsed.data;
  const { data, error } = await curator.supabase
    .from("editorial_candidates")
    .select(
      `
        id,
        provider,
        provider_id,
        type,
        title,
        artist_name,
        cover_url,
        deezer_url,
        source,
        source_label,
        seed_label,
        tier,
        reason,
        score,
        status,
        decision_note,
        metadata,
        created_by,
        decided_by,
        starter_track_id,
        created_at,
        updated_at,
        decided_at
      `,
    )
    .eq("status", status)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return editorialCandidateErrorResponse(error);
  }

  return NextResponse.json({ candidates: data ?? [] });
}

export async function POST(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = editorialCandidateUpsertSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Editorial candidate is invalid.");
  }

  const candidate = parsed.data;
  const { data, error } = await curator.supabase.rpc("upsert_editorial_candidate", {
    p_provider: candidate.provider,
    p_provider_id: candidate.provider_id,
    p_type: candidate.type,
    p_title: candidate.title,
    p_artist_name: candidate.artist_name ?? undefined,
    p_cover_url: candidate.cover_url ?? undefined,
    p_deezer_url: candidate.deezer_url ?? undefined,
    p_source: candidate.source,
    p_source_label: candidate.source_label,
    p_seed_label: candidate.seed_label ?? undefined,
    p_tier: candidate.tier,
    p_reason: candidate.reason ?? undefined,
    p_score: candidate.score,
    p_metadata: candidate.metadata,
  });

  if (error) {
    return editorialCandidateErrorResponse(error);
  }

  return NextResponse.json({ ok: true, candidate: data });
}

export async function PATCH(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = editorialCandidateDecisionSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Editorial candidate decision is invalid.");
  }

  const decision = parsed.data;
  const { data, error } = await curator.supabase.rpc(
    "update_editorial_candidate_status",
    {
      p_candidate_id: decision.id,
      p_status: decision.status,
      p_decision_note: decision.decision_note ?? undefined,
      p_starter_track_id: decision.starter_track_id ?? undefined,
    },
  );

  if (error) {
    return editorialCandidateErrorResponse(error);
  }

  return NextResponse.json({ ok: true, candidate: data });
}
