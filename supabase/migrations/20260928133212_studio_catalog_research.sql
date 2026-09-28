CREATE TABLE public.catalog_source_leases (
  source text PRIMARY KEY CHECK (source = 'musicbrainz'),
  token uuid,
  available_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.catalog_source_leases (source) VALUES ('musicbrainz');
ALTER TABLE public.catalog_source_leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_source_leases FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.acquire_catalog_source_lease()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  UPDATE public.catalog_source_leases
  SET token = gen_random_uuid(), available_at = clock_timestamp() + interval '30 seconds'
  WHERE source = 'musicbrainz' AND available_at <= clock_timestamp()
  RETURNING token;
$$;

CREATE FUNCTION public.release_catalog_source_lease(p_token uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  UPDATE public.catalog_source_leases
  SET token = NULL, available_at = clock_timestamp() + interval '1100 milliseconds'
  WHERE source = 'musicbrainz' AND token = p_token;
$$;

REVOKE ALL ON FUNCTION public.acquire_catalog_source_lease() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_catalog_source_lease(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_catalog_source_lease() TO service_role;
GRANT EXECUTE ON FUNCTION public.release_catalog_source_lease(uuid) TO service_role;

DROP FUNCTION public.claim_catalog_enrichment_job();
CREATE FUNCTION public.claim_catalog_enrichment_job(p_job_id uuid DEFAULT NULL)
RETURNS TABLE (job_id uuid, target_type text, target_id uuid, attempts integer)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  WITH next_job AS (
    SELECT job.id
    FROM public.catalog_enrichment_jobs AS job
    WHERE (p_job_id IS NULL OR job.id = p_job_id)
      AND job.attempts < 5
      AND (
        (job.status IN ('pending', 'failed') AND job.next_attempt_at <= now())
        OR (job.status = 'processing' AND job.updated_at <= now() - interval '15 minutes')
      )
    ORDER BY job.next_attempt_at, job.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  ), claimed AS (
    UPDATE public.catalog_enrichment_jobs AS job
    SET status = 'processing', attempts = job.attempts + 1,
        last_error = NULL, updated_at = now()
    FROM next_job
    WHERE job.id = next_job.id
    RETURNING job.id, job.target_type, job.target_id, job.attempts
  )
  SELECT claimed.id, claimed.target_type, claimed.target_id, claimed.attempts FROM claimed;
$$;

REVOKE ALL ON FUNCTION public.claim_catalog_enrichment_job(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_catalog_enrichment_job(uuid) TO service_role;
