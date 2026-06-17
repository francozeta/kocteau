-- Starter source playlists for one-off automated curation imports.
--
-- Purpose:
-- - Track external human-curated sources such as an Apple Music playlist.
-- - Let a script mirror source items into starter_tracks while preserving provenance.
-- - Keep source metadata private to authenticated curators instead of exposing it publicly.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

CREATE TABLE IF NOT EXISTS public.starter_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_source_id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  sync_mode text NOT NULL DEFAULT 'mirror',
  default_tag_slugs text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT starter_sources_pkey PRIMARY KEY (id),
  CONSTRAINT starter_sources_provider_check CHECK (provider = 'apple_music'),
  CONSTRAINT starter_sources_sync_mode_check CHECK (sync_mode IN ('mirror', 'staged')),
  CONSTRAINT starter_sources_provider_source_key UNIQUE (provider, provider_source_id)
);

CREATE TABLE IF NOT EXISTS public.starter_source_items (
  source_id uuid NOT NULL REFERENCES public.starter_sources(id) ON DELETE CASCADE,
  source_item_id text NOT NULL,
  source_position integer NOT NULL,
  title text NOT NULL,
  artist_name text,
  album_title text,
  artwork_url text,
  apple_music_url text,
  duration_ms integer,
  matched_provider text,
  matched_provider_id text,
  matched_score numeric,
  starter_track_id uuid REFERENCES public.starter_tracks(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'synced',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  removed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT starter_source_items_pkey PRIMARY KEY (source_id, source_item_id),
  CONSTRAINT starter_source_items_position_check CHECK (source_position > 0),
  CONSTRAINT starter_source_items_matched_provider_check
    CHECK (matched_provider IS NULL OR matched_provider = 'deezer'),
  CONSTRAINT starter_source_items_status_check
    CHECK (status IN ('synced', 'match_failed', 'removed'))
);

CREATE INDEX IF NOT EXISTS starter_sources_active_provider_idx
  ON public.starter_sources (is_active, provider, updated_at DESC);

CREATE INDEX IF NOT EXISTS starter_source_items_status_position_idx
  ON public.starter_source_items (source_id, status, source_position);

CREATE INDEX IF NOT EXISTS starter_source_items_starter_track_idx
  ON public.starter_source_items (starter_track_id)
  WHERE starter_track_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS starter_source_items_matched_entity_idx
  ON public.starter_source_items (source_id, matched_provider, matched_provider_id)
  WHERE matched_provider IS NOT NULL
    AND matched_provider_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_starter_sources_updated_at
  ON public.starter_sources;
DROP TRIGGER IF EXISTS set_starter_source_items_updated_at
  ON public.starter_source_items;

CREATE TRIGGER set_starter_sources_updated_at
  BEFORE UPDATE ON public.starter_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_starter_source_items_updated_at
  BEFORE UPDATE ON public.starter_source_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.starter_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starter_source_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Starter curators can read starter sources"
  ON public.starter_sources;
DROP POLICY IF EXISTS "Starter curators can insert starter sources"
  ON public.starter_sources;
DROP POLICY IF EXISTS "Starter curators can update starter sources"
  ON public.starter_sources;
DROP POLICY IF EXISTS "Starter curators can delete starter sources"
  ON public.starter_sources;

CREATE POLICY "Starter curators can read starter sources"
  ON public.starter_sources
  FOR SELECT
  TO authenticated
  USING ((select public.is_starter_curator()));

CREATE POLICY "Starter curators can insert starter sources"
  ON public.starter_sources
  FOR INSERT
  TO authenticated
  WITH CHECK ((select public.is_starter_curator()));

CREATE POLICY "Starter curators can update starter sources"
  ON public.starter_sources
  FOR UPDATE
  TO authenticated
  USING ((select public.is_starter_curator()))
  WITH CHECK ((select public.is_starter_curator()));

CREATE POLICY "Starter curators can delete starter sources"
  ON public.starter_sources
  FOR DELETE
  TO authenticated
  USING ((select public.is_starter_curator()));

DROP POLICY IF EXISTS "Starter curators can read starter source items"
  ON public.starter_source_items;
DROP POLICY IF EXISTS "Starter curators can insert starter source items"
  ON public.starter_source_items;
DROP POLICY IF EXISTS "Starter curators can update starter source items"
  ON public.starter_source_items;
DROP POLICY IF EXISTS "Starter curators can delete starter source items"
  ON public.starter_source_items;

CREATE POLICY "Starter curators can read starter source items"
  ON public.starter_source_items
  FOR SELECT
  TO authenticated
  USING ((select public.is_starter_curator()));

CREATE POLICY "Starter curators can insert starter source items"
  ON public.starter_source_items
  FOR INSERT
  TO authenticated
  WITH CHECK ((select public.is_starter_curator()));

CREATE POLICY "Starter curators can update starter source items"
  ON public.starter_source_items
  FOR UPDATE
  TO authenticated
  USING ((select public.is_starter_curator()))
  WITH CHECK ((select public.is_starter_curator()));

CREATE POLICY "Starter curators can delete starter source items"
  ON public.starter_source_items
  FOR DELETE
  TO authenticated
  USING ((select public.is_starter_curator()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.starter_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.starter_source_items TO authenticated;

COMMIT;
