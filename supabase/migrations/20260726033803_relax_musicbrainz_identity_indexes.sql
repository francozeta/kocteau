ALTER TABLE public.artists
  DROP CONSTRAINT IF EXISTS artists_musicbrainz_id_key;

DROP INDEX IF EXISTS public.entities_musicbrainz_recording_id_key;
DROP INDEX IF EXISTS public.entities_musicbrainz_release_group_id_key;

CREATE INDEX IF NOT EXISTS artists_musicbrainz_id_idx
  ON public.artists (musicbrainz_id)
  WHERE musicbrainz_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS entities_musicbrainz_recording_id_idx
  ON public.entities (musicbrainz_recording_id)
  WHERE musicbrainz_recording_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS entities_musicbrainz_release_group_id_idx
  ON public.entities (musicbrainz_release_group_id)
  WHERE musicbrainz_release_group_id IS NOT NULL;
