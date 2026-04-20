import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { getDeezerTrack } from "@/lib/deezer";
import { supabaseAdmin } from "@/lib/supabase/admin";

type SupabaseAdminClient = NonNullable<ReturnType<typeof supabaseAdmin>>;

type ResolvedMusicLink = {
  platform: "spotify" | "apple_music";
  label: string;
  url: string;
  provider_id: string | null;
  confidence: number;
  sort_order: number;
};

type SpotifyTokenState = {
  accessToken: string;
  expiresAt: number;
};

type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifyTrackItem[];
  };
};

type SpotifyTrackItem = {
  id: string;
  name: string;
  external_ids?: {
    isrc?: string | null;
  } | null;
  external_urls?: {
    spotify?: string | null;
  } | null;
  artists?: Array<{
    name?: string | null;
  }>;
};

type AppleMusicSongsResponse = {
  data?: AppleMusicSongItem[];
};

type AppleMusicSongItem = {
  id: string;
  attributes?: {
    name?: string | null;
    artistName?: string | null;
    isrc?: string | null;
    url?: string | null;
  } | null;
};

let spotifyTokenState: SpotifyTokenState | null = null;

type MusicLinkSyncFailureReason =
  | "missing_entity"
  | "missing_service_role"
  | "deezer_not_found"
  | "isrc_missing"
  | "rpc_error";

export type MusicLinkSyncResult =
  | {
      ok: true;
      entityId: string;
      isrc: string;
      linksResolved: number;
    }
  | {
      ok: false;
      reason: MusicLinkSyncFailureReason;
      message?: string;
    };

export type MusicLinksBackfillResult = {
  ok: boolean;
  attempted: number;
  processed: number;
  synced: number;
  linksResolved: number;
  entitiesCreated: number;
  skipped: number;
  reasons: Partial<Record<MusicLinkSyncFailureReason, number>>;
  providerStatus: ReturnType<typeof getMusicLinkResolverStatus>;
};

type MusicLinksBackfillTarget = {
  entityId: string;
  providerId: string;
  source: "entity" | "starter";
};

type StarterBackfillRow = {
  provider: string;
  provider_id: string;
  type: "track" | "album";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
};

export function getMusicLinkResolverStatus() {
  return {
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    spotifyConfigured: Boolean(
      process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET,
    ),
    appleMusicConfigured: Boolean(process.env.APPLE_MUSIC_DEVELOPER_TOKEN),
  };
}

export function normalizeIsrc(value: string | null | undefined) {
  const normalized = value?.replace(/[^a-z0-9]/gi, "").toUpperCase() ?? "";
  return /^[A-Z0-9]{12}$/.test(normalized) ? normalized : null;
}

function normalizeComparableText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getTextMatchBoost({
  title,
  artistName,
  candidateTitle,
  candidateArtistName,
}: {
  title: string;
  artistName: string | null;
  candidateTitle: string | null | undefined;
  candidateArtistName: string | null | undefined;
}) {
  const sourceTitle = normalizeComparableText(title);
  const sourceArtist = normalizeComparableText(artistName);
  const targetTitle = normalizeComparableText(candidateTitle);
  const targetArtist = normalizeComparableText(candidateArtistName);
  let boost = 0;

  if (sourceTitle && targetTitle && (sourceTitle === targetTitle || targetTitle.includes(sourceTitle))) {
    boost += 0.04;
  }

  if (sourceArtist && targetArtist && (sourceArtist === targetArtist || targetArtist.includes(sourceArtist))) {
    boost += 0.03;
  }

  return boost;
}

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (spotifyTokenState && spotifyTokenState.expiresAt > Date.now() + 60_000) {
    return spotifyTokenState.accessToken;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.warn("[music-links.spotify.token] failed", {
      status: response.status,
    });
    return null;
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    return null;
  }

  spotifyTokenState = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(payload.expires_in ?? 3600, 60) * 1000,
  };

  return spotifyTokenState.accessToken;
}

async function resolveSpotifyTrackLink({
  isrc,
  title,
  artistName,
}: {
  isrc: string;
  title: string;
  artistName: string | null;
}): Promise<ResolvedMusicLink | null> {
  const accessToken = await getSpotifyAccessToken();

  if (!accessToken) {
    return null;
  }

  const params = new URLSearchParams({
    q: `isrc:${isrc}`,
    type: "track",
    limit: "5",
    market: process.env.MUSIC_LINKS_MARKET ?? "US",
  });
  const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.warn("[music-links.spotify.search] failed", {
      status: response.status,
    });
    return null;
  }

  const payload = (await response.json()) as SpotifySearchResponse;
  const candidates = payload.tracks?.items ?? [];
  const scoredCandidates = candidates
    .filter((track) => normalizeIsrc(track.external_ids?.isrc) === isrc)
    .map((track) => ({
      track,
      score:
        0.92 +
        getTextMatchBoost({
          title,
          artistName,
          candidateTitle: track.name,
          candidateArtistName: track.artists?.[0]?.name,
        }),
    }))
    .sort((a, b) => b.score - a.score);
  const match = scoredCandidates[0];
  const url = match?.track.external_urls?.spotify;

  if (!match || !url) {
    return null;
  }

  return {
    platform: "spotify",
    label: "Spotify",
    url,
    provider_id: match.track.id,
    confidence: Math.min(match.score, 0.99),
    sort_order: 10,
  };
}

async function resolveAppleMusicTrackLink({
  isrc,
  title,
  artistName,
}: {
  isrc: string;
  title: string;
  artistName: string | null;
}): Promise<ResolvedMusicLink | null> {
  const developerToken = process.env.APPLE_MUSIC_DEVELOPER_TOKEN;

  if (!developerToken) {
    return null;
  }

  const storefront = (process.env.APPLE_MUSIC_STOREFRONT ?? "us").toLowerCase();
  const params = new URLSearchParams({
    "filter[isrc]": isrc,
  });
  const response = await fetch(
    `https://api.music.apple.com/v1/catalog/${storefront}/songs?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${developerToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.warn("[music-links.apple.search] failed", {
      status: response.status,
      storefront,
    });
    return null;
  }

  const payload = (await response.json()) as AppleMusicSongsResponse;
  const candidates = payload.data ?? [];
  const scoredCandidates = candidates
    .filter((song) => normalizeIsrc(song.attributes?.isrc) === isrc)
    .map((song) => ({
      song,
      score:
        0.9 +
        getTextMatchBoost({
          title,
          artistName,
          candidateTitle: song.attributes?.name,
          candidateArtistName: song.attributes?.artistName,
        }),
    }))
    .sort((a, b) => b.score - a.score);
  const match = scoredCandidates[0];
  const url = match?.song.attributes?.url;

  if (!match || !url) {
    return null;
  }

  return {
    platform: "apple_music",
    label: "Apple Music",
    url,
    provider_id: match.song.id,
    confidence: Math.min(match.score, 0.99),
    sort_order: 20,
  };
}

export async function syncEntityMusicLinksFromDeezer(
  {
    entityId,
    providerId,
    context,
  }: {
    entityId: string | null | undefined;
    providerId: string;
    context: string;
  },
) {
  if (!entityId) {
    return {
      ok: false,
      reason: "missing_entity",
    } satisfies MusicLinkSyncResult;
  }

  const admin = supabaseAdmin();

  if (!admin) {
    console.warn("[music-links.sync] skipped", {
      context,
      entityId,
      message: "Missing SUPABASE_SERVICE_ROLE_KEY",
    });
    return {
      ok: false,
      reason: "missing_service_role",
      message: "Missing SUPABASE_SERVICE_ROLE_KEY",
    } satisfies MusicLinkSyncResult;
  }

  const deezerTrack = await getDeezerTrack(providerId).catch((error: unknown) => {
    console.warn("[music-links.deezer] skipped", {
      context,
      providerId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  });
  const isrc = normalizeIsrc(deezerTrack?.isrc);

  if (!deezerTrack) {
    return {
      ok: false,
      reason: "deezer_not_found",
    } satisfies MusicLinkSyncResult;
  }

  if (!isrc) {
    return {
      ok: false,
      reason: "isrc_missing",
    } satisfies MusicLinkSyncResult;
  }

  const resolved = await Promise.allSettled([
    resolveSpotifyTrackLink({
      isrc,
      title: deezerTrack.title,
      artistName: deezerTrack.artist_name,
    }),
    resolveAppleMusicTrackLink({
      isrc,
      title: deezerTrack.title,
      artistName: deezerTrack.artist_name,
    }),
  ]);
  const links = resolved.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : [],
  );
  const { error } = await admin.rpc("upsert_entity_music_link_resolution", {
    p_entity_id: entityId,
    p_isrc: isrc,
    p_links: links as unknown as Json,
  });

  if (error) {
    console.warn("[music-links.sync] skipped", {
      context,
      entityId,
      code: error.code ?? null,
      message: error.message ?? null,
    });
    return {
      ok: false,
      reason: "rpc_error",
      message: error.message,
    } satisfies MusicLinkSyncResult;
  }

  return {
    ok: true,
    entityId,
    isrc,
    linksResolved: links.length,
  } satisfies MusicLinkSyncResult;
}

async function getExistingEntityIdForStarter(
  admin: SupabaseAdminClient,
  starter: StarterBackfillRow,
) {
  const { data, error } = await admin
    .from("entities")
    .select("id")
    .eq("provider", starter.provider)
    .eq("type", starter.type)
    .eq("provider_id", starter.provider_id)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0]?.id ?? null;
}

async function ensureEntityForStarterTrack(
  admin: SupabaseAdminClient,
  starter: StarterBackfillRow,
) {
  const existingId = await getExistingEntityIdForStarter(admin, starter);

  if (existingId) {
    return {
      entityId: existingId,
      created: false,
    };
  }

  const { data, error } = await admin
    .from("entities")
    .insert({
      provider: starter.provider,
      provider_id: starter.provider_id,
      type: starter.type,
      title: starter.title,
      artist_name: starter.artist_name,
      cover_url: starter.cover_url,
      deezer_url: starter.deezer_url,
    })
    .select("id")
    .single();

  if (error) {
    const retryId = await getExistingEntityIdForStarter(admin, starter);

    if (retryId) {
      return {
        entityId: retryId,
        created: false,
      };
    }

    throw new Error(error.message);
  }

  return {
    entityId: data.id,
    created: true,
  };
}

export async function backfillDeezerMusicLinks({
  limit = 24,
  includeExistingEntities = true,
  includeStarterTracks = true,
}: {
  limit?: number;
  includeExistingEntities?: boolean;
  includeStarterTracks?: boolean;
} = {}): Promise<MusicLinksBackfillResult> {
  const providerStatus = getMusicLinkResolverStatus();
  const boundedLimit = Math.max(1, Math.min(limit, 50));
  const reasons: MusicLinksBackfillResult["reasons"] = {};
  const targets = new Map<string, MusicLinksBackfillTarget>();
  let entitiesCreated = 0;

  if (!providerStatus.serviceRoleConfigured) {
    return {
      ok: false,
      attempted: 0,
      processed: 0,
      synced: 0,
      linksResolved: 0,
      entitiesCreated,
      skipped: 0,
      reasons: {
        missing_service_role: 1,
      },
      providerStatus,
    };
  }

  const admin = supabaseAdmin();

  if (!admin) {
    return {
      ok: false,
      attempted: 0,
      processed: 0,
      synced: 0,
      linksResolved: 0,
      entitiesCreated,
      skipped: 0,
      reasons: {
        missing_service_role: 1,
      },
      providerStatus,
    };
  }

  if (includeStarterTracks && targets.size < boundedLimit) {
    const { data, error } = await admin
      .from("starter_tracks")
      .select("provider, provider_id, type, title, artist_name, cover_url, deezer_url")
      .eq("provider", "deezer")
      .eq("type", "track")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(boundedLimit);

    if (error) {
      throw new Error(error.message);
    }

    for (const starter of (data ?? []) as StarterBackfillRow[]) {
      if (targets.size >= boundedLimit || targets.has(`entity:${starter.provider_id}`)) {
        continue;
      }

      const ensured = await ensureEntityForStarterTrack(admin, starter);
      entitiesCreated += ensured.created ? 1 : 0;
      targets.set(`starter:${starter.provider_id}`, {
        entityId: ensured.entityId,
        providerId: starter.provider_id,
        source: "starter",
      });
    }
  }

  if (includeExistingEntities && targets.size < boundedLimit) {
    const { data, error } = await admin
      .from("entities")
      .select("id, provider_id")
      .eq("provider", "deezer")
      .eq("type", "track")
      .order("updated_at", { ascending: false })
      .limit(boundedLimit);

    if (error) {
      throw new Error(error.message);
    }

    for (const entity of data ?? []) {
      if (targets.size >= boundedLimit || targets.has(`starter:${entity.provider_id}`)) {
        continue;
      }

      targets.set(`entity:${entity.provider_id}`, {
        entityId: entity.id,
        providerId: entity.provider_id,
        source: "entity",
      });
    }
  }

  let processed = 0;
  let synced = 0;
  let linksResolved = 0;
  let skipped = 0;

  for (const target of Array.from(targets.values()).slice(0, boundedLimit)) {
    processed += 1;

    const result = await syncEntityMusicLinksFromDeezer({
      entityId: target.entityId,
      providerId: target.providerId,
      context: `music-links.backfill.${target.source}`,
    });

    if (result.ok) {
      linksResolved += result.linksResolved;
      synced += result.linksResolved > 0 ? 1 : 0;
      continue;
    }

    skipped += 1;
    reasons[result.reason] = (reasons[result.reason] ?? 0) + 1;
  }

  return {
    ok: true,
    attempted: targets.size,
    processed,
    synced,
    linksResolved,
    entitiesCreated,
    skipped,
    reasons,
    providerStatus,
  };
}
