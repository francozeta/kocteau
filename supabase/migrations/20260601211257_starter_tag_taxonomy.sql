-- Starter Studio taxonomy expansion and curator tag editing.
--
-- Run from the Supabase SQL editor after
-- 20260531160852_editorial_starter_layer.sql.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

INSERT INTO public.preference_tags (
  kind,
  slug,
  label,
  description,
  is_featured,
  sort_order
)
VALUES
  ('era', 'pre-1970s', 'Pre-1970s', 'Older catalog, standards, early scenes, and records that feel outside the modern cycle.', true, 380),
  ('era', '1970s', '1970s', 'Analog rooms, disco, punk, soul, dub, and early electronic edges.', true, 390),
  ('era', '1980s', '1980s', 'Drum machines, synth gloss, post-punk shadows, and pop becoming cinematic.', true, 400),
  ('era', '1990s', '1990s', 'A loose marker for the decade rather than nostalgia as a genre.', true, 410),
  ('era', '2000s', '2000s', 'Blog-era crossings, indie rooms, club shifts, and early digital texture.', true, 420),
  ('era', '2010s', '2010s', 'Streaming-era scenes, bedroom production, and genre borders getting softer.', true, 430),
  ('era', '2020s', '2020s', 'Recent records shaping the current Kocteau listening shelf.', true, 440),
  ('era', 'current', 'Current', 'New and near-current releases that should stay close to the feed.', true, 450),
  ('format', 'singles', 'Singles', 'One-track statements, hooks, and quick entry points.', true, 500),
  ('format', 'eps', 'EPs', 'Short-form releases with enough shape to show an artist direction.', true, 510),
  ('format', 'album-focused', 'Album-focused', 'Records that make more sense when heard as a full body of work.', true, 520),
  ('format', 'deep-cuts', 'Deep cuts', 'Non-obvious tracks that reward slower listening or catalog digging.', true, 530),
  ('format', 'live-recordings', 'Live recordings', 'Performances where room, crowd, or arrangement changes the record.', true, 540),
  ('format', 'remixes', 'Remixes', 'Alternate versions, club mutations, and reinterpretations.', true, 550),
  ('format', 'b-sides', 'B-sides', 'Loose ends, companion tracks, and hidden catalog corners.', true, 560),
  ('format', 'dj-mixes', 'DJ mixes', 'Selections where sequence and transition carry the listening context.', true, 570)
ON CONFLICT (slug)
DO UPDATE SET
  kind = EXCLUDED.kind,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;

DROP FUNCTION IF EXISTS public.update_preference_tag(
  uuid,
  public.preference_kind,
  text,
  text,
  boolean
);

CREATE OR REPLACE FUNCTION public.update_preference_tag(
  p_tag_id uuid,
  p_kind public.preference_kind,
  p_label text,
  p_description text DEFAULT NULL,
  p_is_featured boolean DEFAULT true
)
RETURNS public.preference_tags
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_slug text;
  v_tag public.preference_tags%rowtype;
BEGIN
  IF NOT public.is_starter_curator() THEN
    RAISE EXCEPTION 'Not allowed to edit preference tags.'
      USING ERRCODE = '42501';
  END IF;

  v_slug := lower(
    regexp_replace(
      regexp_replace(coalesce(nullif(p_label, ''), ''), '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-|-$)',
      '',
      'g'
    )
  );

  IF v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Preference tag label is invalid.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.preference_tags
  SET
    kind = p_kind,
    slug = v_slug,
    label = btrim(p_label),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    is_featured = coalesce(p_is_featured, true)
  WHERE id = p_tag_id
  RETURNING * INTO v_tag;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Preference tag not found.'
      USING ERRCODE = '02000';
  END IF;

  RETURN v_tag;
END;
$$;

REVOKE ALL ON FUNCTION public.update_preference_tag(
  uuid,
  public.preference_kind,
  text,
  text,
  boolean
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_preference_tag(
  uuid,
  public.preference_kind,
  text,
  text,
  boolean
) TO authenticated;

COMMIT;
