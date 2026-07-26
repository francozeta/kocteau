CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'deezer',
  provider_id text NOT NULL,
  name text NOT NULL,
  image_url text,
  deezer_url text,
  musicbrainz_id uuid,
  musicbrainz_match_score smallint,
  artist_type text,
  country_code text,
  disambiguation text,
  life_span_begin text,
  life_span_end text,
  genres text[] NOT NULL DEFAULT '{}'::text[],
  musicbrainz_synced_at timestamp with time zone,
  short_id text GENERATED ALWAYS AS (left(replace(id::text, '-', ''), 12)) STORED,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT artists_provider_provider_id_key UNIQUE (provider, provider_id),
  CONSTRAINT artists_short_id_key UNIQUE (short_id),
  CONSTRAINT artists_musicbrainz_id_key UNIQUE (musicbrainz_id),
  CONSTRAINT artists_provider_check CHECK (provider = 'deezer'),
  CONSTRAINT artists_name_check CHECK (length(btrim(name)) BETWEEN 1 AND 160),
  CONSTRAINT artists_musicbrainz_match_score_check
    CHECK (musicbrainz_match_score IS NULL OR musicbrainz_match_score BETWEEN 0 AND 100)
);

ALTER TABLE public.entities
  ADD COLUMN IF NOT EXISTS artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_album_id uuid REFERENCES public.entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS release_date date,
  ADD COLUMN IF NOT EXISTS record_type text,
  ADD COLUMN IF NOT EXISTS musicbrainz_recording_id uuid,
  ADD COLUMN IF NOT EXISTS musicbrainz_release_group_id uuid,
  ADD COLUMN IF NOT EXISTS musicbrainz_match_score smallint,
  ADD COLUMN IF NOT EXISTS disambiguation text,
  ADD COLUMN IF NOT EXISTS first_release_date text,
  ADD COLUMN IF NOT EXISTS genres text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS musicbrainz_synced_at timestamp with time zone;

ALTER TABLE public.entities
  DROP CONSTRAINT IF EXISTS entities_musicbrainz_match_score_check;

ALTER TABLE public.entities
  ADD CONSTRAINT entities_musicbrainz_match_score_check
  CHECK (musicbrainz_match_score IS NULL OR musicbrainz_match_score BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS entities_artist_id_idx
  ON public.entities (artist_id)
  WHERE artist_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS entities_parent_album_id_idx
  ON public.entities (parent_album_id)
  WHERE parent_album_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS artists_name_trgm_idx
  ON public.artists USING gin (name extensions.gin_trgm_ops);

CREATE UNIQUE INDEX IF NOT EXISTS entities_musicbrainz_recording_id_key
  ON public.entities (musicbrainz_recording_id)
  WHERE musicbrainz_recording_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS entities_musicbrainz_release_group_id_key
  ON public.entities (musicbrainz_release_group_id)
  WHERE musicbrainz_release_group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.catalog_enrichment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT catalog_enrichment_jobs_target_key UNIQUE (target_type, target_id),
  CONSTRAINT catalog_enrichment_jobs_target_type_check
    CHECK (target_type IN ('artist', 'entity')),
  CONSTRAINT catalog_enrichment_jobs_status_check
    CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  CONSTRAINT catalog_enrichment_jobs_attempts_check CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS catalog_enrichment_jobs_claim_idx
  ON public.catalog_enrichment_jobs (next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_enrichment_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artists are readable" ON public.artists;
CREATE POLICY "Artists are readable"
  ON public.artists
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.artists TO anon, authenticated;
REVOKE ALL ON public.catalog_enrichment_jobs FROM anon, authenticated;

DROP TRIGGER IF EXISTS set_artists_updated_at ON public.artists;
CREATE TRIGGER set_artists_updated_at
BEFORE UPDATE ON public.artists
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_catalog_enrichment_jobs_updated_at
  ON public.catalog_enrichment_jobs;
CREATE TRIGGER set_catalog_enrichment_jobs_updated_at
BEFORE UPDATE ON public.catalog_enrichment_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.claim_catalog_enrichment_job()
RETURNS TABLE (
  job_id uuid,
  target_type text,
  target_id uuid,
  attempts integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH next_job AS (
    SELECT job.id
    FROM public.catalog_enrichment_jobs AS job
    WHERE job.status IN ('pending', 'failed')
      AND job.next_attempt_at <= now()
      AND job.attempts < 5
    ORDER BY job.next_attempt_at, job.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  ),
  claimed AS (
    UPDATE public.catalog_enrichment_jobs AS job
    SET status = 'processing',
        attempts = job.attempts + 1,
        last_error = NULL,
        updated_at = now()
    FROM next_job
    WHERE job.id = next_job.id
    RETURNING job.id, job.target_type, job.target_id, job.attempts
  )
  SELECT claimed.id, claimed.target_type, claimed.target_id, claimed.attempts
  FROM claimed;
$$;

REVOKE ALL ON FUNCTION public.claim_catalog_enrichment_job() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_catalog_enrichment_job() TO service_role;

DROP FUNCTION IF EXISTS public.create_review_with_entity(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  boolean
);

CREATE OR REPLACE FUNCTION public.create_review_with_entity(
  p_provider text,
  p_provider_id text,
  p_type public.entity_type,
  p_title text,
  p_artist_name text DEFAULT NULL,
  p_cover_url text DEFAULT NULL,
  p_deezer_url text DEFAULT NULL,
  p_review_title text DEFAULT NULL,
  p_review_body text DEFAULT NULL,
  p_rating numeric DEFAULT NULL,
  p_is_pinned boolean DEFAULT false,
  p_artist_provider_id text DEFAULT NULL,
  p_artist_image_url text DEFAULT NULL,
  p_album_provider_id text DEFAULT NULL,
  p_album_title text DEFAULT NULL,
  p_album_cover_url text DEFAULT NULL,
  p_album_deezer_url text DEFAULT NULL,
  p_album_release_date date DEFAULT NULL,
  p_album_record_type text DEFAULT NULL
)
RETURNS TABLE (entity_id uuid, review_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_artist_id uuid;
  v_album_id uuid;
  v_entity_id uuid;
  v_review_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
  END IF;

  IF p_provider <> 'deezer' THEN
    RAISE EXCEPTION 'Unsupported provider.' USING ERRCODE = '22023';
  END IF;

  IF p_type NOT IN ('track'::public.entity_type, 'album'::public.entity_type) THEN
    RAISE EXCEPTION 'Unsupported review entity type.' USING ERRCODE = '22023';
  END IF;

  IF p_rating IS NULL OR p_rating < 0.5 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Invalid rating.' USING ERRCODE = '22023';
  END IF;

  IF nullif(btrim(coalesce(p_artist_provider_id, '')), '') IS NOT NULL
     AND nullif(btrim(coalesce(p_artist_name, '')), '') IS NOT NULL THEN
    INSERT INTO public.artists (
      provider,
      provider_id,
      name,
      image_url,
      deezer_url,
      updated_at
    )
    VALUES (
      p_provider,
      btrim(p_artist_provider_id),
      btrim(p_artist_name),
      p_artist_image_url,
      'https://www.deezer.com/artist/' || btrim(p_artist_provider_id),
      now()
    )
    ON CONFLICT (provider, provider_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      image_url = coalesce(EXCLUDED.image_url, public.artists.image_url),
      deezer_url = coalesce(EXCLUDED.deezer_url, public.artists.deezer_url),
      updated_at = now()
    RETURNING id INTO v_artist_id;

    INSERT INTO public.catalog_enrichment_jobs (target_type, target_id)
    VALUES ('artist', v_artist_id)
    ON CONFLICT (target_type, target_id) DO NOTHING;
  END IF;

  IF p_type = 'track'::public.entity_type
     AND nullif(btrim(coalesce(p_album_provider_id, '')), '') IS NOT NULL
     AND nullif(btrim(coalesce(p_album_title, '')), '') IS NOT NULL THEN
    INSERT INTO public.entities (
      provider,
      provider_id,
      type,
      title,
      artist_name,
      artist_id,
      cover_url,
      deezer_url,
      release_date,
      record_type,
      updated_at
    )
    VALUES (
      p_provider,
      btrim(p_album_provider_id),
      'album'::public.entity_type,
      btrim(p_album_title),
      p_artist_name,
      v_artist_id,
      coalesce(p_album_cover_url, p_cover_url),
      coalesce(
        nullif(btrim(coalesce(p_album_deezer_url, '')), ''),
        'https://www.deezer.com/album/' || btrim(p_album_provider_id)
      ),
      p_album_release_date,
      p_album_record_type,
      now()
    )
    ON CONFLICT (provider, type, provider_id)
    DO UPDATE SET
      title = EXCLUDED.title,
      artist_name = coalesce(EXCLUDED.artist_name, public.entities.artist_name),
      artist_id = coalesce(EXCLUDED.artist_id, public.entities.artist_id),
      cover_url = coalesce(EXCLUDED.cover_url, public.entities.cover_url),
      deezer_url = coalesce(EXCLUDED.deezer_url, public.entities.deezer_url),
      release_date = coalesce(EXCLUDED.release_date, public.entities.release_date),
      record_type = coalesce(EXCLUDED.record_type, public.entities.record_type),
      updated_at = now()
    RETURNING id INTO v_album_id;

    INSERT INTO public.catalog_enrichment_jobs (target_type, target_id)
    VALUES ('entity', v_album_id)
    ON CONFLICT (target_type, target_id) DO NOTHING;
  END IF;

  INSERT INTO public.entities (
    provider,
    provider_id,
    type,
    title,
    artist_name,
    artist_id,
    parent_album_id,
    cover_url,
    deezer_url,
    release_date,
    record_type,
    updated_at
  )
  VALUES (
    p_provider,
    p_provider_id,
    p_type,
    p_title,
    p_artist_name,
    v_artist_id,
    CASE WHEN p_type = 'track'::public.entity_type THEN v_album_id ELSE NULL END,
    p_cover_url,
    p_deezer_url,
    CASE WHEN p_type = 'album'::public.entity_type THEN p_album_release_date ELSE NULL END,
    CASE WHEN p_type = 'album'::public.entity_type THEN p_album_record_type ELSE NULL END,
    now()
  )
  ON CONFLICT (provider, type, provider_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    artist_name = coalesce(EXCLUDED.artist_name, public.entities.artist_name),
    artist_id = coalesce(EXCLUDED.artist_id, public.entities.artist_id),
    parent_album_id = coalesce(EXCLUDED.parent_album_id, public.entities.parent_album_id),
    cover_url = coalesce(EXCLUDED.cover_url, public.entities.cover_url),
    deezer_url = coalesce(EXCLUDED.deezer_url, public.entities.deezer_url),
    release_date = coalesce(EXCLUDED.release_date, public.entities.release_date),
    record_type = coalesce(EXCLUDED.record_type, public.entities.record_type),
    updated_at = now()
  RETURNING id INTO v_entity_id;

  INSERT INTO public.catalog_enrichment_jobs (target_type, target_id)
  VALUES ('entity', v_entity_id)
  ON CONFLICT (target_type, target_id) DO NOTHING;

  INSERT INTO public.reviews (
    author_id,
    entity_id,
    title,
    body,
    rating,
    is_pinned
  )
  VALUES (
    v_user_id,
    v_entity_id,
    p_review_title,
    p_review_body,
    p_rating,
    coalesce(p_is_pinned, false)
  )
  RETURNING id INTO v_review_id;

  RETURN QUERY SELECT v_entity_id, v_review_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_review_with_entity(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_review_with_entity(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  text
) TO authenticated;

INSERT INTO public.catalog_enrichment_jobs (target_type, target_id)
SELECT 'entity', entity.id
FROM public.entities AS entity
ON CONFLICT (target_type, target_id) DO NOTHING;
