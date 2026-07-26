import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { isFullUuid, isShortUuidPrefix } from "@/lib/seo-routes";
import { supabasePublic } from "@/lib/supabase/public";
import type { Database } from "@/lib/supabase/database.types";

export type ArtistPage = Database["public"]["Tables"]["artists"]["Row"];

const artistSelect =
  "id, provider, provider_id, name, image_url, deezer_url, musicbrainz_id, musicbrainz_match_score, artist_type, country_code, disambiguation, life_span_begin, life_span_end, genres, musicbrainz_synced_at, short_id, created_at, updated_at";
const artistLookupRevalidateSeconds = 15 * 60;

function logArtistQueryError(
  scope: string,
  error: { code?: string | null; message?: string | null },
  context: Record<string, unknown>,
) {
  console.error(`[artists.${scope}] failed`, {
    code: error.code ?? null,
    message: error.message ?? null,
    context,
  });
}

const getArtistPageByIdCached = (artistId: string) =>
  unstable_cache(
    async () => {
      const supabase = supabasePublic();
      const { data, error } = await supabase
        .from("artists")
        .select(artistSelect)
        .eq("id", artistId)
        .maybeSingle<ArtistPage>();

      if (error) {
        throw error;
      }

      return data;
    },
    ["artist-page", artistId],
    {
      revalidate: artistLookupRevalidateSeconds,
      tags: ["artists", `artist:${artistId}`],
    },
  );

export async function getArtistPageById(artistId: string) {
  try {
    return await getArtistPageByIdCached(artistId)();
  } catch (error) {
    logArtistQueryError(
      "getArtistPageById",
      error as { code?: string; message?: string },
      { artistId },
    );
    return null;
  }
}

export const getArtistPageByRouteId = cache(async function getArtistPageByRouteId(
  routeId: string,
) {
  try {
    if (isFullUuid(routeId)) {
      return await getArtistPageById(routeId);
    }

    if (!isShortUuidPrefix(routeId)) {
      return null;
    }

    const normalizedRouteId = routeId.toLowerCase();
    const supabase = supabasePublic();
    let query = supabase.from("artists").select(artistSelect).limit(2);

    query =
      normalizedRouteId.length === 8
        ? query.like("short_id", `${normalizedRouteId}%`)
        : query.eq("short_id", normalizedRouteId);

    const { data, error } = await query.returns<ArtistPage[]>();

    if (error) {
      throw error;
    }

    return data?.length === 1 ? data[0] : null;
  } catch (error) {
    logArtistQueryError(
      "getArtistPageByRouteId",
      error as { code?: string; message?: string },
      { routeId },
    );
    return null;
  }
});

export const getArtistPageByProvider = cache(async function getArtistPageByProvider(
  provider: string,
  providerId: string,
) {
  try {
    const supabase = supabasePublic();
    const loader = unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from("artists")
          .select(artistSelect)
          .eq("provider", provider)
          .eq("provider_id", providerId)
          .maybeSingle<ArtistPage>();

        if (error) {
          throw error;
        }

        return data;
      },
      ["artist-page-by-provider", provider, providerId],
      {
        revalidate: artistLookupRevalidateSeconds,
        tags: ["artists", `artist-provider:${provider}:${providerId}`],
      },
    );

    return await loader();
  } catch (error) {
    logArtistQueryError(
      "getArtistPageByProvider",
      error as { code?: string; message?: string },
      { provider, providerId },
    );
    return null;
  }
});
