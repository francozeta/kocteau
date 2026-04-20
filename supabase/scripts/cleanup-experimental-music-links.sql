-- Kocteau experimental music links cleanup.
-- Run only if the previous ISRC/Spotify/Apple experiment was applied.
--
-- This removes the experimental platform-link layer and leaves the app
-- Deezer-first. It does not touch entities, reviews, starter picks, taste tags,
-- profiles, or auth data.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DROP FUNCTION IF EXISTS public.upsert_entity_music_link_resolution(uuid, text, jsonb);

DROP TABLE IF EXISTS public.entity_external_links;

DROP INDEX IF EXISTS public.entities_isrc_idx;

ALTER TABLE public.entities
  DROP CONSTRAINT IF EXISTS entities_isrc_check;

ALTER TABLE public.entities
  DROP COLUMN IF EXISTS isrc;

COMMIT;
