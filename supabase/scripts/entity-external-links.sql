-- Kocteau entity external links.
-- Run this before deploying UI that reads Spotify/Apple/other platform links.
--
-- Purpose:
-- - Keep Deezer as the ingestion provider.
-- - Store ISRC as the canonical recording identifier for tracks.
-- - Allow tracks, albums, and artists to expose platform links over time.
-- - Avoid adding one nullable column per platform to public.entities.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

ALTER TABLE public.entities
  ADD COLUMN IF NOT EXISTS isrc text;

ALTER TABLE public.entities
  DROP CONSTRAINT IF EXISTS entities_isrc_check;

ALTER TABLE public.entities
  ADD CONSTRAINT entities_isrc_check
  CHECK (isrc IS NULL OR isrc ~ '^[A-Z0-9]{12}$');

CREATE INDEX IF NOT EXISTS entities_isrc_idx
  ON public.entities (isrc)
  WHERE isrc IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.entity_external_links (
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (
    platform IN (
      'deezer',
      'spotify',
      'apple_music',
      'youtube_music',
      'tidal',
      'soundcloud',
      'bandcamp',
      'website'
    )
  ),
  label text,
  url text NOT NULL CHECK (url ~ '^https?://'),
  provider_id text,
  match_source text NOT NULL DEFAULT 'manual'
    CHECK (match_source IN ('manual', 'isrc', 'provider', 'import')),
  confidence numeric NOT NULL DEFAULT 1
    CHECK (confidence >= 0 AND confidence <= 1),
  sort_order integer NOT NULL DEFAULT 0,
  last_checked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entity_external_links_pkey PRIMARY KEY (entity_id, platform)
);

ALTER TABLE public.entity_external_links
  ADD COLUMN IF NOT EXISTS provider_id text;

ALTER TABLE public.entity_external_links
  ADD COLUMN IF NOT EXISTS match_source text NOT NULL DEFAULT 'manual';

ALTER TABLE public.entity_external_links
  ADD COLUMN IF NOT EXISTS confidence numeric NOT NULL DEFAULT 1;

ALTER TABLE public.entity_external_links
  ADD COLUMN IF NOT EXISTS last_checked_at timestamp with time zone;

ALTER TABLE public.entity_external_links
  DROP CONSTRAINT IF EXISTS entity_external_links_match_source_check;

ALTER TABLE public.entity_external_links
  ADD CONSTRAINT entity_external_links_match_source_check
  CHECK (match_source IN ('manual', 'isrc', 'provider', 'import'));

ALTER TABLE public.entity_external_links
  DROP CONSTRAINT IF EXISTS entity_external_links_confidence_check;

ALTER TABLE public.entity_external_links
  ADD CONSTRAINT entity_external_links_confidence_check
  CHECK (confidence >= 0 AND confidence <= 1);

CREATE INDEX IF NOT EXISTS entity_external_links_platform_idx
  ON public.entity_external_links (platform, entity_id);

ALTER TABLE public.entity_external_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entity external links are readable"
  ON public.entity_external_links;

CREATE POLICY "Entity external links are readable"
  ON public.entity_external_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.entity_external_links TO anon, authenticated;

DROP FUNCTION IF EXISTS public.upsert_entity_music_link_resolution(uuid, text, jsonb);

CREATE OR REPLACE FUNCTION public.upsert_entity_music_link_resolution(
  p_entity_id uuid,
  p_isrc text DEFAULT NULL,
  p_links jsonb DEFAULT '[]'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_isrc text;
  v_link_count integer := 0;
BEGIN
  IF coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Not allowed to update entity music links.'
      USING ERRCODE = '42501';
  END IF;

  v_isrc := upper(regexp_replace(coalesce(p_isrc, ''), '[^a-zA-Z0-9]', '', 'g'));

  IF v_isrc <> '' AND v_isrc !~ '^[A-Z0-9]{12}$' THEN
    RAISE EXCEPTION 'ISRC is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF v_isrc <> '' THEN
    UPDATE public.entities
    SET
      isrc = v_isrc,
      updated_at = now()
    WHERE id = p_entity_id
      AND (isrc IS NULL OR isrc <> v_isrc);
  END IF;

  WITH incoming AS (
    SELECT
      p_entity_id AS entity_id,
      link.platform,
      nullif(link.label, '') AS label,
      link.url,
      nullif(link.provider_id, '') AS provider_id,
      coalesce(nullif(link.match_source, ''), 'isrc') AS match_source,
      least(1, greatest(0, coalesce(link.confidence, 0.9))) AS confidence,
      coalesce(link.sort_order, 100) AS sort_order
    FROM jsonb_to_recordset(coalesce(p_links, '[]'::jsonb)) AS link (
      platform text,
      label text,
      url text,
      provider_id text,
      match_source text,
      confidence numeric,
      sort_order integer
    )
    WHERE link.platform IS NOT NULL
      AND link.url IS NOT NULL
  ),
  upserted AS (
    INSERT INTO public.entity_external_links (
      entity_id,
      platform,
      label,
      url,
      provider_id,
      match_source,
      confidence,
      sort_order,
      last_checked_at,
      updated_at
    )
    SELECT
      entity_id,
      platform,
      label,
      url,
      provider_id,
      match_source,
      confidence,
      sort_order,
      now(),
      now()
    FROM incoming
    ON CONFLICT (entity_id, platform)
    DO UPDATE SET
      label = coalesce(EXCLUDED.label, public.entity_external_links.label),
      url = EXCLUDED.url,
      provider_id = coalesce(EXCLUDED.provider_id, public.entity_external_links.provider_id),
      match_source = EXCLUDED.match_source,
      confidence = EXCLUDED.confidence,
      sort_order = EXCLUDED.sort_order,
      last_checked_at = now(),
      updated_at = now()
    RETURNING 1
  )
  SELECT count(*)::integer
  INTO v_link_count
  FROM upserted;

  RETURN v_link_count;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_entity_music_link_resolution(uuid, text, jsonb)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.upsert_entity_music_link_resolution(uuid, text, jsonb)
  TO service_role;

COMMIT;
