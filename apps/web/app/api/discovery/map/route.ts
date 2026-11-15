import { NextResponse } from "next/server";
import { z } from "zod";
import { getDeezerErrorDetails, isDeezerProviderId } from "@/lib/deezer";
import { getDiscoveryCandidates } from "@/lib/discovery/candidates";
import { validationErrorResponse } from "@/lib/validation/server";

const discoveryMapQuerySchema = z.object({
  providerId: z.string().trim().refine(isDeezerProviderId),
  seedType: z.enum(["track", "album", "artist"]).default("track"),
  title: z.string().trim().min(1).max(200),
  artistName: z.string().trim().max(200).optional(),
  artistProviderId: z.string().trim().refine(isDeezerProviderId).optional(),
  entityId: z.string().uuid().optional(),
  lane: z.enum(["fast", "deep", "full"]).optional(),
  expanded: z.enum(["true", "false"]).optional(),
  variation: z.coerce.number().int().min(0).max(15).default(0),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = discoveryMapQuerySchema.safeParse({
    providerId: searchParams.get("providerId") ?? undefined,
    seedType: searchParams.get("seedType") ?? undefined,
    title: searchParams.get("title") ?? undefined,
    artistName: searchParams.get("artistName") ?? undefined,
    artistProviderId: searchParams.get("artistProviderId") ?? undefined,
    entityId: searchParams.get("entityId") ?? undefined,
    lane: searchParams.get("lane") ?? undefined,
    expanded: searchParams.get("expanded") ?? undefined,
    variation: searchParams.get("variation") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Discovery seed is invalid.");
  }

  const lane =
    parsed.data.lane ?? (parsed.data.expanded === "true" ? "full" : "fast");
  try {
    const result = await getDiscoveryCandidates({
      providerId: parsed.data.providerId,
      seedType: parsed.data.seedType,
      artistProviderId: parsed.data.artistProviderId,
      lane,
      variation: parsed.data.variation,
      signal: request.signal,
    });
    if (!result)
      return NextResponse.json(
        { error: "This catalog entry could not open a discovery route." },
        { status: 404 },
      );
    // Only the public candidate pool is shared. Listener memory/ranking stay in
    // the scoped browser session, never in a CDN response or cache key.
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": result.partial
          ? "no-store"
          : "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    if (!request.signal.aborted)
      console.error(
        "[discovery.map] candidate lookup failed",
        getDeezerErrorDetails(error),
      );
    return NextResponse.json(
      { error: "This music neighborhood could not load. Try again." },
      {
        status: request.signal.aborted ? 499 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
