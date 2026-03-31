import { NextResponse } from "next/server";
import { getRecentlyDiscussedTracks } from "@/lib/queries/discovery";
import { recentTracksQuerySchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = recentTracksQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Invalid tracks request.");
  }

  const tracks = await getRecentlyDiscussedTracks(parsed.data.limit);
  return NextResponse.json(tracks);
}
