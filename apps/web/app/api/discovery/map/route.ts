import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getDeezerAlbum,
  getDeezerAlbumTracks,
  getDeezerArtist,
  getDeezerArtistTopTracks,
  isDeezerProviderId,
} from "@/lib/deezer";
import { getTrackRecommendations } from "@/lib/queries/track-recommendations";
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
});

type RecommendationSeed = {
  providerId: string;
  title: string;
  artistName: string | null;
};

async function resolveRecommendationSeed(
  input: z.infer<typeof discoveryMapQuerySchema>,
): Promise<RecommendationSeed | null> {
  if (input.seedType === "track") {
    return {
      providerId: input.providerId,
      title: input.title,
      artistName: input.artistName ?? null,
    };
  }

  if (input.seedType === "artist") {
    const artist = await getDeezerArtist(input.providerId);

    if (!artist) {
      return null;
    }

    const tracks = await getDeezerArtistTopTracks(artist, 12);
    const track = tracks[0];

    return track
      ? {
          providerId: track.provider_id,
          title: track.title,
          artistName: artist.name,
        }
      : null;
  }

  const album = await getDeezerAlbum(input.providerId);
  const artistId = album?.artist_id ?? input.artistProviderId;

  if (!album || !artistId) {
    return null;
  }

  const tracks = await getDeezerAlbumTracks(
    album,
    {
      id: artistId,
      name: album.artist_name ?? input.artistName ?? "Unknown artist",
      fan_count: null,
    },
    18,
  );
  const track = tracks.toSorted(
    (left, right) => (right.rank ?? 0) - (left.rank ?? 0),
  )[0];

  return track
    ? {
        providerId: track.provider_id,
        title: track.title,
        artistName: album.artist_name ?? input.artistName ?? track.artist_name,
      }
    : null;
}

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
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Discovery seed is invalid.");
  }

  const lane =
    parsed.data.lane ?? (parsed.data.expanded === "true" ? "full" : "fast");
  const recommendationSeed = await resolveRecommendationSeed(parsed.data);

  if (!recommendationSeed) {
    return NextResponse.json(
      { error: "This catalog entry could not open a discovery route." },
      { status: 404 },
    );
  }

  const groups = await getTrackRecommendations({
    currentEntityId:
      parsed.data.seedType === "track" ? parsed.data.entityId : undefined,
    currentProviderId: recommendationSeed.providerId,
    title: recommendationSeed.title,
    artistName: recommendationSeed.artistName,
    limit: lane === "fast" ? 10 : 18,
    includeLocalSignals: false,
    includeRelatedCandidates: lane !== "deep",
    resolveLocalLinks: false,
    includeDeepCuts: lane !== "fast",
    resolveCatalogContext: lane !== "fast",
  });

  return NextResponse.json(
    { groups },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}
