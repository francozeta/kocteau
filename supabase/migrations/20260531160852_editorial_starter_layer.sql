-- Kocteau editorial starter layer.
-- Run from the Supabase SQL editor after recommendation-v2.sql.
--
-- Purpose:
-- - Keep human-curated starter content separate from user reviews.
-- - Give new users useful review prompts while For You is still sparse.
-- - Let taste onboarding tags rank starter tracks without adding a heavy ML layer.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS official_label text;

CREATE TABLE IF NOT EXISTS public.profile_roles (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('curator', 'admin')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_roles_pkey PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS profile_roles_role_user_idx
  ON public.profile_roles (role, user_id);

ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own roles"
  ON public.profile_roles;

CREATE POLICY "Users can read their own roles"
  ON public.profile_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON public.profile_roles TO authenticated;

UPDATE public.profiles
SET
  is_official = true,
  official_label = coalesce(official_label, 'Official'),
  updated_at = now()
WHERE username = 'kocteau';

INSERT INTO public.profile_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE username = 'kocteau'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.editorial_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  curation_note text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT editorial_collections_pkey PRIMARY KEY (id),
  CONSTRAINT editorial_collections_slug_key UNIQUE (slug),
  CONSTRAINT editorial_collections_slug_check
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS public.starter_tracks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'deezer',
  provider_id text NOT NULL,
  type public.entity_type NOT NULL DEFAULT 'track',
  title text NOT NULL,
  artist_name text,
  cover_url text,
  deezer_url text,
  prompt text,
  editorial_note text,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT starter_tracks_pkey PRIMARY KEY (id),
  CONSTRAINT starter_tracks_provider_check CHECK (provider = 'deezer'),
  CONSTRAINT starter_tracks_type_check CHECK (type = 'track'),
  CONSTRAINT starter_tracks_provider_entity_key UNIQUE (provider, provider_id, type)
);

CREATE TABLE IF NOT EXISTS public.editorial_collection_items (
  collection_id uuid NOT NULL
    REFERENCES public.editorial_collections(id) ON DELETE CASCADE,
  starter_track_id uuid NOT NULL
    REFERENCES public.starter_tracks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT editorial_collection_items_pkey
    PRIMARY KEY (collection_id, starter_track_id),
  CONSTRAINT editorial_collection_items_position_check CHECK (position >= 0)
);

CREATE TABLE IF NOT EXISTS public.starter_track_tags (
  starter_track_id uuid NOT NULL
    REFERENCES public.starter_tracks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL
    REFERENCES public.preference_tags(id) ON DELETE CASCADE,
  weight numeric NOT NULL DEFAULT 1
    CHECK (weight > 0 AND weight <= 3),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT starter_track_tags_pkey PRIMARY KEY (starter_track_id, tag_id)
);

CREATE INDEX IF NOT EXISTS editorial_collections_published_sort_idx
  ON public.editorial_collections (is_published, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS editorial_collection_items_collection_position_idx
  ON public.editorial_collection_items (collection_id, position);

CREATE INDEX IF NOT EXISTS editorial_collection_items_track_idx
  ON public.editorial_collection_items (starter_track_id);

CREATE INDEX IF NOT EXISTS starter_tracks_active_sort_idx
  ON public.starter_tracks (is_active, is_featured DESC, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS starter_track_tags_tag_idx
  ON public.starter_track_tags (tag_id, weight DESC);

CREATE INDEX IF NOT EXISTS entities_provider_type_provider_id_idx
  ON public.entities (provider, type, provider_id);

CREATE INDEX IF NOT EXISTS reviews_author_entity_idx
  ON public.reviews (author_id, entity_id);

ALTER TABLE public.editorial_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starter_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starter_track_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published editorial collections are readable"
  ON public.editorial_collections;
DROP POLICY IF EXISTS "Published editorial collection items are readable"
  ON public.editorial_collection_items;
DROP POLICY IF EXISTS "Active starter tracks are readable"
  ON public.starter_tracks;
DROP POLICY IF EXISTS "Starter track tags are readable for active tracks"
  ON public.starter_track_tags;

CREATE POLICY "Published editorial collections are readable"
  ON public.editorial_collections
  FOR SELECT
  TO anon, authenticated
  USING (is_published);

CREATE POLICY "Active starter tracks are readable"
  ON public.starter_tracks
  FOR SELECT
  TO anon, authenticated
  USING (is_active);

CREATE POLICY "Published editorial collection items are readable"
  ON public.editorial_collection_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.editorial_collections collection
      JOIN public.starter_tracks track
        ON track.id = editorial_collection_items.starter_track_id
      WHERE collection.id = editorial_collection_items.collection_id
        AND collection.is_published
        AND track.is_active
    )
  );

CREATE POLICY "Starter track tags are readable for active tracks"
  ON public.starter_track_tags
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.starter_tracks track
      WHERE track.id = starter_track_tags.starter_track_id
        AND track.is_active
    )
  );

GRANT SELECT ON public.editorial_collections TO anon, authenticated;
GRANT SELECT ON public.editorial_collection_items TO anon, authenticated;
GRANT SELECT ON public.starter_tracks TO anon, authenticated;
GRANT SELECT ON public.starter_track_tags TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_starter_tracks(integer);
DROP FUNCTION IF EXISTS public.upsert_starter_track(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  uuid[],
  text
);
DROP FUNCTION IF EXISTS public.upsert_starter_track(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  text
);
DROP FUNCTION IF EXISTS public.archive_starter_track(uuid);
DROP FUNCTION IF EXISTS public.upsert_preference_tag(
  public.preference_kind,
  text,
  text,
  text,
  boolean
);
DROP FUNCTION IF EXISTS public.sync_entity_tags_from_starter_track(
  uuid,
  text,
  text,
  public.entity_type,
  numeric
);
DROP FUNCTION IF EXISTS public.is_starter_curator();

CREATE OR REPLACE FUNCTION public.is_starter_curator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_roles role
    WHERE role.user_id = auth.uid()
      AND role.role IN ('curator', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_starter_tracks(
  p_limit integer DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  provider text,
  provider_id text,
  type public.entity_type,
  title text,
  artist_name text,
  cover_url text,
  deezer_url text,
  prompt text,
  editorial_note text,
  collection_slug text,
  collection_title text,
  matched_tag_count integer,
  score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
WITH bounded AS (
  SELECT greatest(1, least(coalesce(p_limit, 6), 12)) AS page_limit
),
viewer_tags AS (
  SELECT
    upt.tag_id,
    greatest(upt.weight, 0.1) AS preference_weight
  FROM public.user_preference_tags upt
  WHERE upt.user_id = auth.uid()
),
scored AS (
  SELECT
    st.id,
    st.provider,
    st.provider_id,
    st.type,
    st.title,
    st.artist_name,
    st.cover_url,
    st.deezer_url,
    st.prompt,
    st.editorial_note,
    (
      array_agg(ec.slug ORDER BY ec.sort_order, eci.position)
        FILTER (WHERE ec.id IS NOT NULL)
    )[1] AS collection_slug,
    (
      array_agg(ec.title ORDER BY ec.sort_order, eci.position)
        FILTER (WHERE ec.id IS NOT NULL)
    )[1] AS collection_title,
    count(DISTINCT vt.tag_id)::integer AS matched_tag_count,
    (
      coalesce(sum(vt.preference_weight * stt.weight), 0)
      + CASE WHEN st.is_featured THEN 0.35 ELSE 0 END
      + CASE WHEN bool_or(ec.id IS NOT NULL) THEN 0.2 ELSE 0 END
    )::numeric AS score,
    coalesce(
      min(eci.position) FILTER (WHERE ec.id IS NOT NULL),
      st.sort_order
    ) AS editorial_position,
    st.is_featured,
    st.sort_order,
    st.created_at
  FROM public.starter_tracks st
  LEFT JOIN public.starter_track_tags stt
    ON stt.starter_track_id = st.id
  LEFT JOIN viewer_tags vt
    ON vt.tag_id = stt.tag_id
  LEFT JOIN public.editorial_collection_items eci
    ON eci.starter_track_id = st.id
  LEFT JOIN public.editorial_collections ec
    ON ec.id = eci.collection_id
    AND ec.is_published
  WHERE st.is_active
    AND NOT EXISTS (
      SELECT 1
      FROM public.entities reviewed_entity
      JOIN public.reviews viewer_review
        ON viewer_review.entity_id = reviewed_entity.id
      WHERE viewer_review.author_id = auth.uid()
        AND reviewed_entity.provider = st.provider
        AND reviewed_entity.provider_id = st.provider_id
        AND reviewed_entity.type = st.type
    )
  GROUP BY
    st.id,
    st.provider,
    st.provider_id,
    st.type,
    st.title,
    st.artist_name,
    st.cover_url,
    st.deezer_url,
    st.prompt,
    st.editorial_note,
    st.is_featured,
    st.sort_order,
    st.created_at
)
SELECT
  scored.id,
  scored.provider,
  scored.provider_id,
  scored.type,
  scored.title,
  scored.artist_name,
  scored.cover_url,
  scored.deezer_url,
  scored.prompt,
  scored.editorial_note,
  scored.collection_slug,
  scored.collection_title,
  scored.matched_tag_count,
  scored.score
FROM scored
CROSS JOIN bounded
ORDER BY
  scored.score DESC,
  scored.is_featured DESC,
  scored.editorial_position ASC,
  scored.sort_order ASC,
  scored.created_at DESC,
  scored.id DESC
LIMIT (SELECT page_limit FROM bounded);
$$;

GRANT EXECUTE ON FUNCTION public.get_starter_tracks(integer)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_entity_tags_from_starter_track(
  p_entity_id uuid,
  p_provider text,
  p_provider_id text,
  p_type public.entity_type,
  p_signal_weight numeric DEFAULT 1
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
WITH starter AS (
  SELECT st.id
  FROM public.starter_tracks st
  JOIN public.entities entity
    ON entity.id = p_entity_id
    AND entity.provider = st.provider
    AND entity.provider_id = st.provider_id
    AND entity.type = st.type
  WHERE st.provider = p_provider
    AND st.provider_id = p_provider_id
    AND st.type = p_type
    AND st.is_active
    AND p_entity_id IS NOT NULL
  LIMIT 1
),
current_tags AS (
  SELECT
    stt.tag_id,
    least(3, greatest(0.2, stt.weight * greatest(coalesce(p_signal_weight, 1), 0.2))) AS weight
  FROM starter
  JOIN public.starter_track_tags stt
    ON stt.starter_track_id = starter.id
),
deleted AS (
  DELETE FROM public.entity_preference_tags ept
  WHERE ept.entity_id = p_entity_id
    AND ept.source = 'system'
    AND EXISTS (SELECT 1 FROM starter)
    AND NOT EXISTS (
      SELECT 1
      FROM current_tags current_tag
      WHERE current_tag.tag_id = ept.tag_id
    )
  RETURNING 1
),
upserted AS (
  INSERT INTO public.entity_preference_tags (
    entity_id,
    tag_id,
    source,
    weight,
    updated_at
  )
  SELECT
    p_entity_id,
    current_tags.tag_id,
    'system',
    current_tags.weight,
    now()
  FROM current_tags
  ON CONFLICT (entity_id, tag_id)
  DO UPDATE SET
    source = CASE
      WHEN public.entity_preference_tags.source = 'manual'
        THEN public.entity_preference_tags.source
      ELSE EXCLUDED.source
    END,
    weight = least(3, greatest(public.entity_preference_tags.weight, EXCLUDED.weight)),
    updated_at = now()
  RETURNING 1
)
SELECT (
  (SELECT count(*) FROM upserted)
  + (SELECT count(*) FROM deleted)
)::integer;
$$;

CREATE OR REPLACE FUNCTION public.upsert_preference_tag(
  p_kind public.preference_kind,
  p_label text,
  p_slug text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_is_featured boolean DEFAULT true
)
RETURNS public.preference_tags
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_slug text;
  v_next_sort_order integer;
  v_tag public.preference_tags%rowtype;
BEGIN
  IF NOT public.is_starter_curator() THEN
    RAISE EXCEPTION 'Not allowed to curate preference tags.'
      USING ERRCODE = '42501';
  END IF;

  v_slug := lower(
    regexp_replace(
      regexp_replace(coalesce(nullif(p_slug, ''), p_label), '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-|-$)',
      '',
      'g'
    )
  );

  IF v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Preference tag slug is invalid.'
      USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(max(sort_order) + 1, 0)
  INTO v_next_sort_order
  FROM public.preference_tags
  WHERE kind = p_kind;

  INSERT INTO public.preference_tags (
    kind,
    slug,
    label,
    description,
    is_featured,
    sort_order
  )
  VALUES (
    p_kind,
    v_slug,
    p_label,
    p_description,
    p_is_featured,
    v_next_sort_order
  )
  ON CONFLICT (slug)
  DO UPDATE SET
    label = EXCLUDED.label,
    description = coalesce(EXCLUDED.description, public.preference_tags.description),
    is_featured = public.preference_tags.is_featured OR EXCLUDED.is_featured
  RETURNING * INTO v_tag;

  RETURN v_tag;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_starter_track(
  p_provider text,
  p_provider_id text,
  p_type public.entity_type,
  p_title text,
  p_artist_name text DEFAULT NULL,
  p_cover_url text DEFAULT NULL,
  p_deezer_url text DEFAULT NULL,
  p_prompt text DEFAULT NULL,
  p_editorial_note text DEFAULT NULL,
  p_is_featured boolean DEFAULT false,
  p_is_active boolean DEFAULT true,
  p_tag_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_collection_slug text DEFAULT 'starter-picks'
)
RETURNS public.starter_tracks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_collection_id uuid;
  v_next_position integer;
  v_track public.starter_tracks%rowtype;
  v_entity_id uuid;
BEGIN
  IF NOT public.is_starter_curator() THEN
    RAISE EXCEPTION 'Not allowed to curate starter tracks.'
      USING ERRCODE = '42501';
  END IF;

  IF p_provider <> 'deezer' OR p_type <> 'track' THEN
    RAISE EXCEPTION 'Only Deezer tracks can be starter tracks.'
      USING ERRCODE = '22023';
  END IF;

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
    coalesce(nullif(p_collection_slug, ''), 'starter-picks'),
    'Starter picks',
    'A compact set of records to help new listeners start reviewing.',
    'Early Kocteau editorial picks.',
    true,
    0,
    now()
  )
  ON CONFLICT (slug)
  DO UPDATE SET
    is_published = true,
    updated_at = now()
  RETURNING id INTO v_collection_id;

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
    updated_at
  )
  VALUES (
    p_provider,
    p_provider_id,
    p_type,
    p_title,
    p_artist_name,
    p_cover_url,
    p_deezer_url,
    p_prompt,
    p_editorial_note,
    p_is_active,
    p_is_featured,
    now()
  )
  ON CONFLICT (provider, provider_id, type)
  DO UPDATE SET
    title = EXCLUDED.title,
    artist_name = EXCLUDED.artist_name,
    cover_url = EXCLUDED.cover_url,
    deezer_url = EXCLUDED.deezer_url,
    prompt = EXCLUDED.prompt,
    editorial_note = EXCLUDED.editorial_note,
    is_active = EXCLUDED.is_active,
    is_featured = EXCLUDED.is_featured,
    updated_at = now()
  RETURNING * INTO v_track;

  SELECT coalesce(max(position) + 1, 0)
  INTO v_next_position
  FROM public.editorial_collection_items
  WHERE collection_id = v_collection_id;

  INSERT INTO public.editorial_collection_items (
    collection_id,
    starter_track_id,
    position,
    note
  )
  VALUES (
    v_collection_id,
    v_track.id,
    v_next_position,
    p_editorial_note
  )
  ON CONFLICT (collection_id, starter_track_id)
  DO UPDATE SET
    note = coalesce(EXCLUDED.note, public.editorial_collection_items.note);

  DELETE FROM public.starter_track_tags
  WHERE starter_track_id = v_track.id;

  INSERT INTO public.starter_track_tags (
    starter_track_id,
    tag_id,
    weight
  )
  SELECT
    v_track.id,
    preference.id,
    CASE
      WHEN preference.kind = 'genre' THEN 1.45
      WHEN preference.kind IN ('mood', 'scene', 'style') THEN 1.25
      ELSE 1
    END
  FROM public.preference_tags preference
  WHERE preference.id = ANY(coalesce(p_tag_ids, ARRAY[]::uuid[]))
  ON CONFLICT (starter_track_id, tag_id)
  DO UPDATE SET
    weight = EXCLUDED.weight;

  SELECT entity.id
  INTO v_entity_id
  FROM public.entities entity
  WHERE entity.provider = p_provider
    AND entity.provider_id = p_provider_id
    AND entity.type = p_type
  LIMIT 1;

  IF v_entity_id IS NOT NULL THEN
    PERFORM public.sync_entity_tags_from_starter_track(
      v_entity_id,
      p_provider,
      p_provider_id,
      p_type,
      1
    );
  END IF;

  RETURN v_track;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_starter_track(
  p_starter_track_id uuid
)
RETURNS public.starter_tracks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_track public.starter_tracks%rowtype;
BEGIN
  IF NOT public.is_starter_curator() THEN
    RAISE EXCEPTION 'Not allowed to curate starter tracks.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.starter_tracks
  SET
    is_active = false,
    updated_at = now()
  WHERE id = p_starter_track_id
  RETURNING * INTO v_track;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Starter track not found.'
      USING ERRCODE = '02000';
  END IF;

  RETURN v_track;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_starter_curator()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_starter_track(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  uuid[],
  text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_starter_track(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_preference_tag(
  public.preference_kind,
  text,
  text,
  text,
  boolean
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_entity_tags_from_starter_track(
  uuid,
  text,
  text,
  public.entity_type,
  numeric
) TO authenticated;

REVOKE ALL ON FUNCTION public.is_starter_curator()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_starter_tracks(integer)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_starter_track(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  uuid[],
  text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archive_starter_track(uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_preference_tag(
  public.preference_kind,
  text,
  text,
  text,
  boolean
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_entity_tags_from_starter_track(
  uuid,
  text,
  text,
  public.entity_type,
  numeric
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_starter_curator()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_starter_tracks(integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_starter_track(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  uuid[],
  text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_starter_track(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_preference_tag(
  public.preference_kind,
  text,
  text,
  text,
  boolean
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_entity_tags_from_starter_track(
  uuid,
  text,
  text,
  public.entity_type,
  numeric
) TO authenticated;

COMMIT;
