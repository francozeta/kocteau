import { NextResponse } from "next/server";
import { z } from "zod";
import { isDeezerProviderId } from "@/lib/deezer";
import { getTrackRecommendations } from "@/lib/queries/track-recommendations";
import { validationErrorResponse } from "@/lib/validation/server";

const discoveryMapQuerySchema = z.object({
  providerId: z.string().trim().refine(isDeezerProviderId),
  title: z.string().trim().min(1).max(200),
  artistName: z.string().trim().max(200).optional(),
  entityId: z.string().uuid().optional(),
  expanded: z.enum(["true", "false"]).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = discoveryMapQuerySchema.safeParse({
    providerId: searchParams.get("providerId") ?? undefined,
    title: searchParams.get("title") ?? undefined,
    artistName: searchParams.get("artistName") ?? undefined,
    entityId: searchParams.get("entityId") ?? undefined,
    expanded: searchParams.get("expanded") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Discovery seed is invalid.");
  }

  const expanded = parsed.data.expanded === "true";
  const groups = await getTrackRecommendations({
    currentEntityId: parsed.data.entityId,
    currentProviderId: parsed.data.providerId,
    title: parsed.data.title,
    artistName: parsed.data.artistName,
    limit: expanded ? 12 : 8,
    includeLocalSignals: false,
    resolveLocalLinks: false,
    includeDeepCuts: expanded,
    resolveCatalogContext: expanded,
  });

  return NextResponse.json({ groups });
}
