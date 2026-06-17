import type { AppleMusicPlaylistImportResult } from "./types";
import type { AppleMusicDeezerMatch } from "./deezer-match";

export type GenerateStarterSourceSqlOptions = {
  importResult: AppleMusicPlaylistImportResult;
  matches: AppleMusicDeezerMatch[];
  collectionSlug: string;
  tagSlugs: string[];
  minMatchScore: number;
};

function sqlString(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }

  return `'${value.replaceAll("'", "''")}'`;
}

function sqlNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "NULL";
}

function sqlJson(value: unknown) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlTextArray(values: string[]) {
  if (values.length === 0) {
    return "ARRAY[]::text[]";
  }

  return `ARRAY[${values.map((value) => sqlString(value)).join(", ")}]::text[]`;
}

function getStarterEditorialNote(playlistTitle: string | null) {
  return playlistTitle
    ? `Selected from ${playlistTitle}.`
    : "Selected from an Apple Music source.";
}

function toIncomingValue(match: AppleMusicDeezerMatch) {
  const track = match.track;
  const candidate = match.match;
  const metadata = {
    appleMusicId: track.appleMusicId,
    appleMusicUrl: track.appleMusicUrl,
    album: track.album,
    albumAppleMusicId: track.albumAppleMusicId,
    artistAppleMusicId: track.artistAppleMusicId,
    durationMs: track.durationMs,
    match: {
      score: Number(match.score.toFixed(3)),
      titleScore: Number(match.titleScore.toFixed(3)),
      artistScore: Number(match.artistScore.toFixed(3)),
      releaseDate: match.releaseDate,
      eraSlug: match.eraSlug,
      error: match.error,
      rejectedCandidates: match.rejectedCandidates,
    },
  };

  return `(
    ${sqlString(track.appleMusicId)},
    ${track.position},
    ${sqlString(track.title)},
    ${sqlString(track.artist)},
    ${sqlString(track.album)},
    ${sqlString(track.artwork.url)},
    ${sqlString(track.appleMusicUrl)},
    ${sqlNumber(track.durationMs)},
    ${sqlString(candidate?.provider_id)},
    ${sqlString(candidate?.title)},
    ${sqlString(candidate?.artist_name)},
    ${sqlString(candidate?.cover_url)},
    ${sqlString(candidate?.deezer_url)},
    ${sqlNumber(candidate ? Number(match.score.toFixed(3)) : null)},
    ${sqlString(match.releaseDate)},
    ${sqlString(match.eraSlug)},
    ${sqlJson(metadata)}
  )`;
}

export function generateStarterSourceSql({
  importResult,
  matches,
  collectionSlug,
  tagSlugs,
  minMatchScore,
}: GenerateStarterSourceSqlOptions) {
  if (matches.length === 0) {
    throw new Error("Cannot generate starter source SQL without playlist tracks.");
  }

  const playlistTitle = importResult.playlist.title ?? "Apple Music source";
  const sourceUrl = importResult.playlist.appleMusicUrl || importResult.source.url;
  const incomingValues = matches.map(toIncomingValue).join(",\n");
  const matchedCount = matches.filter((match) => match.match).length;
  const failedCount = matches.length - matchedCount;

  return `-- Kocteau Apple Music starter source sync.
-- Source: ${playlistTitle}
-- Tracks: ${matches.length}
-- Matched to Deezer: ${matchedCount}
-- Match failed: ${failedCount}
-- Minimum match score: ${minMatchScore}
--
-- Review this file before running it in the Supabase SQL Editor.
-- It mirrors this Apple Music playlist into starter_tracks through Deezer matches.

BEGIN;

WITH source_upsert AS (
  INSERT INTO public.starter_sources (
    provider,
    provider_source_id,
    title,
    url,
    sync_mode,
    default_tag_slugs,
    is_active,
    last_synced_at,
    updated_at
  )
  VALUES (
    'apple_music',
    ${sqlString(importResult.playlist.appleMusicId)},
    ${sqlString(playlistTitle)},
    ${sqlString(sourceUrl)},
    'mirror',
    ${sqlTextArray(tagSlugs)},
    true,
    now(),
    now()
  )
  ON CONFLICT (provider, provider_source_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    url = EXCLUDED.url,
    sync_mode = EXCLUDED.sync_mode,
    default_tag_slugs = EXCLUDED.default_tag_slugs,
    is_active = true,
    last_synced_at = now(),
    updated_at = now()
  RETURNING id, default_tag_slugs
),
collection_upsert AS (
  INSERT INTO public.editorial_collections (
    slug,
    title,
    description,
    curation_note,
    is_published,
    sort_order,
    updated_at
  )
  VALUES (
    ${sqlString(collectionSlug)},
    'Starter picks',
    'A compact set of records to help new listeners start reviewing.',
    'Apple Music source mirror for fast Kocteau starter curation.',
    true,
    0,
    now()
  )
  ON CONFLICT (slug)
  DO UPDATE SET
    is_published = true,
    updated_at = now()
  RETURNING id
),
incoming (
  source_item_id,
  source_position,
  title,
  artist_name,
  album_title,
  artwork_url,
  apple_music_url,
  duration_ms,
  matched_provider_id,
  matched_title,
  matched_artist_name,
  matched_cover_url,
  matched_deezer_url,
  matched_score,
  matched_release_date,
  matched_era_slug,
  metadata
) AS (
  VALUES
${incomingValues}
),
matched_incoming AS (
  SELECT DISTINCT ON (incoming.matched_provider_id)
    incoming.*
  FROM incoming
  WHERE incoming.matched_provider_id IS NOT NULL
  ORDER BY incoming.matched_provider_id, incoming.source_position
),
matched_starter_tracks AS (
  INSERT INTO public.starter_tracks (
    provider,
    provider_id,
    type,
    title,
    artist_name,
    cover_url,
    deezer_url,
    prompt,
    editorial_note,
    is_active,
    is_featured,
    sort_order,
    updated_at
  )
  SELECT
    'deezer',
    incoming.matched_provider_id,
    'track'::public.entity_type,
    coalesce(incoming.matched_title, incoming.title),
    coalesce(incoming.matched_artist_name, incoming.artist_name),
    coalesce(incoming.matched_cover_url, incoming.artwork_url),
    incoming.matched_deezer_url,
    'What does ' || coalesce(incoming.matched_title, incoming.title) || ' open up for you?',
    ${sqlString(getStarterEditorialNote(importResult.playlist.title))},
    true,
    false,
    incoming.source_position,
    now()
  FROM matched_incoming incoming
  ON CONFLICT (provider, provider_id, type)
  DO UPDATE SET
    title = EXCLUDED.title,
    artist_name = EXCLUDED.artist_name,
    cover_url = coalesce(EXCLUDED.cover_url, public.starter_tracks.cover_url),
    deezer_url = coalesce(EXCLUDED.deezer_url, public.starter_tracks.deezer_url),
    prompt = coalesce(public.starter_tracks.prompt, EXCLUDED.prompt),
    editorial_note = coalesce(public.starter_tracks.editorial_note, EXCLUDED.editorial_note),
    is_active = true,
    sort_order = EXCLUDED.sort_order,
    updated_at = now()
  RETURNING id, provider_id
),
source_items AS (
  INSERT INTO public.starter_source_items (
    source_id,
    source_item_id,
    source_position,
    title,
    artist_name,
    album_title,
    artwork_url,
    apple_music_url,
    duration_ms,
    matched_provider,
    matched_provider_id,
    matched_score,
    starter_track_id,
    status,
    metadata,
    last_seen_at,
    removed_at,
    updated_at
  )
  SELECT
    source_upsert.id,
    incoming.source_item_id,
    incoming.source_position,
    incoming.title,
    incoming.artist_name,
    incoming.album_title,
    incoming.artwork_url,
    incoming.apple_music_url,
    incoming.duration_ms,
    CASE WHEN incoming.matched_provider_id IS NULL THEN NULL ELSE 'deezer' END,
    incoming.matched_provider_id,
    incoming.matched_score,
    matched_starter_tracks.id,
    CASE WHEN incoming.matched_provider_id IS NULL THEN 'match_failed' ELSE 'synced' END,
    incoming.metadata,
    now(),
    NULL,
    now()
  FROM incoming
  CROSS JOIN source_upsert
  LEFT JOIN matched_starter_tracks
    ON matched_starter_tracks.provider_id = incoming.matched_provider_id
  ON CONFLICT (source_id, source_item_id)
  DO UPDATE SET
    source_position = EXCLUDED.source_position,
    title = EXCLUDED.title,
    artist_name = EXCLUDED.artist_name,
    album_title = EXCLUDED.album_title,
    artwork_url = EXCLUDED.artwork_url,
    apple_music_url = EXCLUDED.apple_music_url,
    duration_ms = EXCLUDED.duration_ms,
    matched_provider = EXCLUDED.matched_provider,
    matched_provider_id = EXCLUDED.matched_provider_id,
    matched_score = EXCLUDED.matched_score,
    starter_track_id = EXCLUDED.starter_track_id,
    status = EXCLUDED.status,
    metadata = EXCLUDED.metadata,
    last_seen_at = now(),
    removed_at = NULL,
    updated_at = now()
  RETURNING *
),
collection_items AS (
  INSERT INTO public.editorial_collection_items (
    collection_id,
    starter_track_id,
    position,
    note
  )
  SELECT
    collection_upsert.id,
    source_items.starter_track_id,
    source_items.source_position,
    ${sqlString(getStarterEditorialNote(importResult.playlist.title))}
  FROM source_items
  CROSS JOIN collection_upsert
  WHERE source_items.starter_track_id IS NOT NULL
  ON CONFLICT (collection_id, starter_track_id)
  DO UPDATE SET
    position = EXCLUDED.position,
    note = coalesce(public.editorial_collection_items.note, EXCLUDED.note)
  RETURNING starter_track_id
),
tagged AS (
  INSERT INTO public.starter_track_tags (
    starter_track_id,
    tag_id,
    weight
  )
  SELECT
    source_items.starter_track_id,
    preference.id,
    CASE
      WHEN preference.kind = 'genre' THEN 1.45
      WHEN preference.kind IN ('mood', 'scene', 'style') THEN 1.25
      ELSE 1
    END
  FROM source_items
  CROSS JOIN source_upsert
  JOIN incoming
    ON incoming.source_item_id = source_items.source_item_id
  CROSS JOIN LATERAL unnest(
    source_upsert.default_tag_slugs ||
    CASE
      WHEN incoming.matched_era_slug IS NULL THEN ARRAY[]::text[]
      ELSE ARRAY[incoming.matched_era_slug]::text[]
    END
  ) requested(slug)
  JOIN public.preference_tags preference
    ON preference.slug = requested.slug
  WHERE source_items.starter_track_id IS NOT NULL
  ON CONFLICT (starter_track_id, tag_id)
  DO UPDATE SET
    weight = greatest(public.starter_track_tags.weight, EXCLUDED.weight)
  RETURNING starter_track_id
),
missing_tags AS (
  SELECT DISTINCT requested.slug
  FROM (
    SELECT unnest(source_upsert.default_tag_slugs) AS slug
    FROM source_upsert
    UNION
    SELECT incoming.matched_era_slug AS slug
    FROM incoming
    WHERE incoming.matched_era_slug IS NOT NULL
  ) requested
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.preference_tags preference
    WHERE preference.slug = requested.slug
  )
),
removed_items AS (
  UPDATE public.starter_source_items item
  SET
    status = 'removed',
    removed_at = coalesce(item.removed_at, now()),
    updated_at = now()
  FROM source_upsert
  WHERE item.source_id = source_upsert.id
    AND NOT EXISTS (
      SELECT 1
      FROM incoming
      WHERE incoming.source_item_id = item.source_item_id
    )
  RETURNING item.starter_track_id
),
removed_collection_items AS (
  DELETE FROM public.editorial_collection_items collection_item
  USING removed_items, collection_upsert
  WHERE collection_item.collection_id = collection_upsert.id
    AND collection_item.starter_track_id = removed_items.starter_track_id
  RETURNING collection_item.starter_track_id
),
archived_removed_starters AS (
  UPDATE public.starter_tracks track
  SET
    is_active = false,
    updated_at = now()
  FROM removed_items
  WHERE track.id = removed_items.starter_track_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.starter_source_items active_item
      WHERE active_item.starter_track_id = track.id
        AND active_item.status = 'synced'
    )
  RETURNING track.id
)
SELECT
  (SELECT count(*) FROM source_items WHERE status = 'synced') AS synced_count,
  (SELECT count(*) FROM source_items WHERE status = 'match_failed') AS match_failed_count,
  (SELECT count(*) FROM removed_items) AS removed_count,
  (SELECT count(*) FROM archived_removed_starters) AS archived_starter_count,
  (SELECT count(DISTINCT starter_track_id) FROM tagged) AS tagged_starter_count,
  coalesce((SELECT array_agg(slug ORDER BY slug) FROM missing_tags), ARRAY[]::text[]) AS missing_tag_slugs;

COMMIT;
`;
}
