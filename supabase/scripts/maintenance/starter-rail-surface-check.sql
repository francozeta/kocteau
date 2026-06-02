-- Starter rail surface checks.
--
-- Run from the Supabase SQL editor after applying:
-- supabase/migrations/20260601195115_starter_tracks_for_surface.sql
--
-- This is read-only. Direct SQL editor calls may not have auth.uid(), so this
-- mainly validates editorial rotation by surface/context. Test through the app
-- to verify viewer-specific taste ranking and reviewed-track filtering.

with surface_checks(surface, context_key) as (
  values
    ('home', 'home'),
    ('profile', 'profile:kocteau'),
    ('track', 'track:sample'),
    ('studio', 'studio:health'),
    ('saved', 'saved')
)
select
  surface_checks.surface,
  surface_checks.context_key,
  starter.provider_id,
  starter.title,
  starter.artist_name,
  starter.collection_slug,
  starter.matched_tag_count,
  starter.score
from surface_checks
cross join lateral public.get_starter_tracks_for_surface(
  6,
  surface_checks.surface,
  surface_checks.context_key,
  '{}'::text[]
) starter
order by
  surface_checks.surface,
  starter.score desc,
  starter.title;
