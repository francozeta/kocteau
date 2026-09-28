CREATE TABLE public.catalog_source_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.catalog_enrichment_jobs(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('deezer', 'musicbrainz')),
  source_entity_type text NOT NULL,
  source_entity_id text,
  status text NOT NULL CHECK (status IN ('resolved', 'no_match', 'failed')),
  lookup jsonb NOT NULL CHECK (jsonb_typeof(lookup) = 'object'),
  facts jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(facts) = 'object'),
  match_score smallint CHECK (match_score BETWEEN 0 AND 100),
  error_code text CHECK (error_code = 'request_failed'),
  schema_version smallint NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_source_observations_source_type_check CHECK (
    (source = 'deezer' AND source_entity_type IN ('track', 'album'))
    OR (source = 'musicbrainz' AND source_entity_type IN ('artist', 'recording', 'release-group'))
  ),
  CONSTRAINT catalog_source_observations_result_check CHECK (
    (status = 'resolved' AND source_entity_id IS NOT NULL
      AND length(btrim(source_entity_id)) > 0 AND error_code IS NULL)
    OR (status = 'no_match' AND source_entity_id IS NULL
      AND match_score IS NULL AND facts = '{}'::jsonb AND error_code IS NULL)
    OR (status = 'failed' AND source_entity_id IS NULL
      AND match_score IS NULL AND facts = '{}'::jsonb AND error_code IS NOT NULL)
  )
);

CREATE INDEX catalog_source_observations_job_source_idx
  ON public.catalog_source_observations (job_id, source, retrieved_at DESC);

ALTER TABLE public.catalog_source_observations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_source_observations FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.catalog_source_observations TO service_role;

CREATE OR REPLACE FUNCTION public.prepare_catalog_enrichment_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prepared integer;
BEGIN
  WITH stale_targets AS (
    SELECT 'artist'::text AS target_type, artist.id AS target_id,
      artist.musicbrainz_synced_at AS synced_at
    FROM public.artists AS artist
    WHERE artist.musicbrainz_synced_at IS NULL
       OR artist.musicbrainz_synced_at < now() - interval '90 days'

    UNION ALL

    SELECT 'entity'::text AS target_type, entity.id AS target_id,
      entity.musicbrainz_synced_at AS synced_at
    FROM public.entities AS entity
    WHERE entity.musicbrainz_synced_at IS NULL
       OR entity.musicbrainz_synced_at < now() - interval '90 days'
  ),
  candidates AS (
    SELECT target.target_type, target.target_id
    FROM stale_targets AS target
    LEFT JOIN public.catalog_enrichment_jobs AS job
      ON job.target_type = target.target_type AND job.target_id = target.target_id
    WHERE job.id IS NULL OR job.status = 'complete'
    ORDER BY target.synced_at ASC NULLS FIRST, target.target_id
    LIMIT 100
  ),
  prepared AS (
    INSERT INTO public.catalog_enrichment_jobs (
      target_type, target_id, status, attempts, next_attempt_at, last_error
    )
    SELECT candidate.target_type, candidate.target_id, 'pending', 0, now(), NULL
    FROM candidates AS candidate
    ON CONFLICT (target_type, target_id)
    DO UPDATE SET status = 'pending', attempts = 0, next_attempt_at = now(),
      last_error = NULL, updated_at = now()
    WHERE public.catalog_enrichment_jobs.status = 'complete'
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_prepared FROM prepared;

  RETURN coalesce(v_prepared, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_catalog_enrichment_jobs()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_catalog_enrichment_jobs() TO service_role;
