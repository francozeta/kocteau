import { NextResponse } from "next/server";
import { requireStarterCurator } from "@/lib/curation/access";
import { getCandidateSourceTracks } from "@/lib/deezer-candidate-source";
import {
  buildStarterCandidateTracks,
} from "@/lib/starter/candidates";
import { starterCandidateQuerySchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function GET(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const { searchParams } = new URL(req.url);
  const parsed = starterCandidateQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    mode: searchParams.get("mode") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Candidate search is invalid.");
  }

  const { q, mode, limit } = parsed.data;
  const activeStarterResult = await curator.supabase
    .from("starter_tracks")
    .select("provider_id")
    .eq("provider", "deezer")
    .eq("is_active", true);

  if (activeStarterResult.error) {
    return NextResponse.json(
      { error: "We could not check active starter picks." },
      { status: 500 },
    );
  }

  const existingProviderIds = new Set(
    (activeStarterResult.data ?? []).flatMap((track) =>
      track.provider_id ? [track.provider_id] : [],
    ),
  );
  const sourceTracks = await getCandidateSourceTracks({
    mode,
    query: q,
    limit,
  });
  const candidates = buildStarterCandidateTracks({
    source: mode,
    seedLabel: sourceTracks.seedLabel,
    tracks: sourceTracks.tracks,
    existingProviderIds,
    limit,
  });

  return NextResponse.json({
    mode,
    query: q,
    seed_label: sourceTracks.seedLabel,
    tracks: candidates,
  });
}
