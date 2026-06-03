-- Editorial candidate queue for human-led starter curation.
-- Apply after 20260601211257_starter_tag_taxonomy.sql.
--
-- Purpose:
-- - Persist Deezer candidate suggestions after the curator finder proposes them.
-- - Keep approval human-led before a track becomes a starter pick.
-- - Preserve curator decisions without exposing raw analytics or private data.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

CREATE TABLE IF NOT EXISTS public.editorial_candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'deezer',
  provider_id text NOT NULL,
  type public.entity_type NOT NULL DEFAULT 'track',
  title text NOT NULL,
  artist_name text,
  cover_url text,
  deezer_url text,
  source text NOT NULL,
  source_label text NOT NULL,
  seed_label text,
  tier text NOT NULL,
  reason text,
  score numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued',
  decision_note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  starter_track_id uuid REFERENCES public.starter_tracks(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  decided_at timestamp with time zone,
  CONSTRAINT editorial_candidates_pkey PRIMARY KEY (id),
  CONSTRAINT editorial_candidates_provider_check CHECK (provider = 'deezer'),
  CONSTRAINT editorial_candidates_type_check CHECK (type = 'track'),
  CONSTRAINT editorial_candidates_source_check
    CHECK (source IN ('related-seed', 'deep-cut', 'manual', 'system-signal')),
  CONSTRAINT editorial_candidates_tier_check
    CHECK (tier IN ('emerging', 'undercovered', 'familiar', 'deep-cut', 'obvious')),
  CONSTRAINT editorial_candidates_status_check
    CHECK (status IN ('queued', 'approved', 'dismissed', 'archived')),
  CONSTRAINT editorial_candidates_provider_entity_key
    UNIQUE (provider, provider_id, type)
);

CREATE INDEX IF NOT EXISTS editorial_candidates_status_score_idx
  ON public.editorial_candidates (status, score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS editorial_candidates_created_by_idx
  ON public.editorial_candidates (created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS editorial_candidates_starter_track_idx
  ON public.editorial_candidates (starter_track_id)
  WHERE starter_track_id IS NOT NULL;

ALTER TABLE public.editorial_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Starter curators can read editorial candidates"
  ON public.editorial_candidates;
DROP POLICY IF EXISTS "Starter curators can insert editorial candidates"
  ON public.editorial_candidates;
DROP POLICY IF EXISTS "Starter curators can update editorial candidates"
  ON public.editorial_candidates;

CREATE POLICY "Starter curators can read editorial candidates"
  ON public.editorial_candidates
  FOR SELECT
  TO authenticated
  USING (public.is_starter_curator());

CREATE POLICY "Starter curators can insert editorial candidates"
  ON public.editorial_candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_starter_curator());

CREATE POLICY "Starter curators can update editorial candidates"
  ON public.editorial_candidates
  FOR UPDATE
  TO authenticated
  USING (public.is_starter_curator())
  WITH CHECK (public.is_starter_curator());

GRANT SELECT, INSERT, UPDATE ON public.editorial_candidates TO authenticated;

DROP FUNCTION IF EXISTS public.upsert_editorial_candidate(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  jsonb
);

CREATE OR REPLACE FUNCTION public.upsert_editorial_candidate(
  p_provider text,
  p_provider_id text,
  p_type public.entity_type,
  p_title text,
  p_artist_name text DEFAULT NULL,
  p_cover_url text DEFAULT NULL,
  p_deezer_url text DEFAULT NULL,
  p_source text DEFAULT 'manual',
  p_source_label text DEFAULT 'Manual',
  p_seed_label text DEFAULT NULL,
  p_tier text DEFAULT 'undercovered',
  p_reason text DEFAULT NULL,
  p_score numeric DEFAULT 0,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.editorial_candidates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate public.editorial_candidates%rowtype;
BEGIN
  IF NOT public.is_starter_curator() THEN
    RAISE EXCEPTION 'Not allowed to curate editorial candidates.'
      USING ERRCODE = '42501';
  END IF;

  IF p_provider <> 'deezer' OR p_type <> 'track' THEN
    RAISE EXCEPTION 'Only Deezer tracks can be editorial candidates.'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.editorial_candidates (
    provider,
    provider_id,
    type,
    title,
    artist_name,
    cover_url,
    deezer_url,
    source,
    source_label,
    seed_label,
    tier,
    reason,
    score,
    status,
    decision_note,
    metadata,
    created_by,
    decided_by,
    starter_track_id,
    decided_at,
    updated_at
  )
  VALUES (
    p_provider,
    p_provider_id,
    p_type,
    btrim(p_title),
    nullif(btrim(coalesce(p_artist_name, '')), ''),
    nullif(btrim(coalesce(p_cover_url, '')), ''),
    nullif(btrim(coalesce(p_deezer_url, '')), ''),
    p_source,
    btrim(p_source_label),
    nullif(btrim(coalesce(p_seed_label, '')), ''),
    p_tier,
    nullif(btrim(coalesce(p_reason, '')), ''),
    coalesce(p_score, 0),
    'queued',
    NULL,
    coalesce(p_metadata, '{}'::jsonb),
    auth.uid(),
    NULL,
    NULL,
    NULL,
    now()
  )
  ON CONFLICT (provider, provider_id, type)
  DO UPDATE SET
    title = EXCLUDED.title,
    artist_name = EXCLUDED.artist_name,
    cover_url = EXCLUDED.cover_url,
    deezer_url = EXCLUDED.deezer_url,
    source = EXCLUDED.source,
    source_label = EXCLUDED.source_label,
    seed_label = EXCLUDED.seed_label,
    tier = EXCLUDED.tier,
    reason = EXCLUDED.reason,
    score = greatest(public.editorial_candidates.score, EXCLUDED.score),
    status = CASE
      WHEN public.editorial_candidates.status = 'approved' THEN 'approved'
      ELSE 'queued'
    END,
    decision_note = CASE
      WHEN public.editorial_candidates.status = 'approved' THEN public.editorial_candidates.decision_note
      ELSE NULL
    END,
    metadata = public.editorial_candidates.metadata || EXCLUDED.metadata,
    updated_at = now(),
    decided_by = CASE
      WHEN public.editorial_candidates.status = 'approved' THEN public.editorial_candidates.decided_by
      ELSE NULL
    END,
    decided_at = CASE
      WHEN public.editorial_candidates.status = 'approved' THEN public.editorial_candidates.decided_at
      ELSE NULL
    END
  RETURNING * INTO v_candidate;

  RETURN v_candidate;
END;
$$;

DROP FUNCTION IF EXISTS public.update_editorial_candidate_status(
  uuid,
  text,
  text,
  uuid
);

CREATE OR REPLACE FUNCTION public.update_editorial_candidate_status(
  p_candidate_id uuid,
  p_status text,
  p_decision_note text DEFAULT NULL,
  p_starter_track_id uuid DEFAULT NULL
)
RETURNS public.editorial_candidates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate public.editorial_candidates%rowtype;
BEGIN
  IF NOT public.is_starter_curator() THEN
    RAISE EXCEPTION 'Not allowed to update editorial candidates.'
      USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('queued', 'approved', 'dismissed', 'archived') THEN
    RAISE EXCEPTION 'Editorial candidate status is invalid.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.editorial_candidates
  SET
    status = p_status,
    decision_note = CASE
      WHEN p_status = 'queued' THEN NULL
      ELSE nullif(btrim(coalesce(p_decision_note, '')), '')
    END,
    starter_track_id = CASE
      WHEN p_status = 'approved' THEN p_starter_track_id
      ELSE NULL
    END,
    decided_by = CASE
      WHEN p_status = 'queued' THEN NULL
      ELSE auth.uid()
    END,
    decided_at = CASE
      WHEN p_status = 'queued' THEN NULL
      ELSE now()
    END,
    updated_at = now()
  WHERE id = p_candidate_id
  RETURNING * INTO v_candidate;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Editorial candidate not found.'
      USING ERRCODE = '02000';
  END IF;

  RETURN v_candidate;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_editorial_candidate(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  jsonb
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.update_editorial_candidate_status(
  uuid,
  text,
  text,
  uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upsert_editorial_candidate(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  jsonb
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.update_editorial_candidate_status(
  uuid,
  text,
  text,
  uuid
) TO authenticated;

COMMIT;
