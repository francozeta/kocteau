-- Kocteau starter featured backfill.
-- Run this in the Supabase SQL Editor when a curated starter source should
-- become visible across starter rails immediately.
--
-- This does not create tracks or tags. It only marks active starter tracks as
-- featured so current rails can use the full curated pool.

BEGIN;

WITH updated AS (
  UPDATE public.starter_tracks track
  SET
    is_featured = true,
    updated_at = now()
  WHERE track.is_active = true
    AND track.is_featured = false
  RETURNING track.id
)
SELECT count(*) AS newly_featured_tracks
FROM updated;

COMMIT;

SELECT
  count(*) FILTER (WHERE is_active = true) AS active_tracks,
  count(*) FILTER (WHERE is_active = true AND is_featured = true) AS featured_tracks,
  count(*) FILTER (WHERE is_active = true AND is_featured = false) AS active_unfeatured_tracks
FROM public.starter_tracks;
