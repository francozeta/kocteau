BEGIN;
SELECT '1..1';

DO $$
DECLARE
  first_token uuid;
  second_token uuid;
  first_job uuid;
  second_job uuid;
  claimed uuid;
BEGIN
  ASSERT NOT has_table_privilege('authenticated', 'public.catalog_source_leases', 'SELECT');
  ASSERT NOT has_table_privilege('service_role', 'public.catalog_source_leases', 'UPDATE');
  ASSERT NOT has_function_privilege('anon', 'public.acquire_catalog_source_lease()', 'EXECUTE');
  ASSERT NOT has_function_privilege('authenticated', 'public.claim_catalog_enrichment_job(uuid)', 'EXECUTE');
  ASSERT has_function_privilege('service_role', 'public.claim_catalog_enrichment_job(uuid)', 'EXECUTE');
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.catalog_source_leases'::regclass);

  first_token := public.acquire_catalog_source_lease();
  ASSERT first_token IS NOT NULL, 'first worker acquires the shared lease';
  ASSERT public.acquire_catalog_source_lease() IS NULL, 'another worker cannot overlap';
  PERFORM public.release_catalog_source_lease(gen_random_uuid());
  ASSERT public.acquire_catalog_source_lease() IS NULL, 'another token cannot release the lease';
  PERFORM public.release_catalog_source_lease(first_token);
  ASSERT public.acquire_catalog_source_lease() IS NULL, 'release retains the provider pacing gap';
  ASSERT (SELECT available_at > clock_timestamp() FROM public.catalog_source_leases);

  UPDATE public.catalog_source_leases SET available_at = now() - interval '1 second';
  second_token := public.acquire_catalog_source_lease();
  ASSERT second_token IS NOT NULL AND second_token <> first_token, 'expired lease recovers with a fresh token';
  PERFORM public.release_catalog_source_lease(first_token);
  ASSERT (SELECT token = second_token FROM public.catalog_source_leases), 'stale worker cannot release a new owner';

  INSERT INTO public.catalog_enrichment_jobs (target_type, target_id)
  VALUES ('entity', gen_random_uuid()) RETURNING id INTO first_job;
  INSERT INTO public.catalog_enrichment_jobs (target_type, target_id)
  VALUES ('entity', gen_random_uuid()) RETURNING id INTO second_job;
  SELECT job_id INTO claimed FROM public.claim_catalog_enrichment_job(second_job);
  ASSERT claimed = second_job, 'Studio claims the requested target only';
  ASSERT (SELECT status = 'pending' AND attempts = 0 FROM public.catalog_enrichment_jobs WHERE id = first_job);
  ASSERT NOT EXISTS (SELECT 1 FROM public.claim_catalog_enrichment_job(second_job)), 'concurrent request cannot reclaim live work';
  UPDATE public.catalog_enrichment_jobs SET status = 'failed', next_attempt_at = now() + interval '1 day' WHERE id = second_job;
  ASSERT NOT EXISTS (SELECT 1 FROM public.claim_catalog_enrichment_job(second_job)), 'targeted claims preserve backoff';
  UPDATE public.catalog_enrichment_jobs SET next_attempt_at = now(), attempts = 5 WHERE id = second_job;
  ASSERT NOT EXISTS (SELECT 1 FROM public.claim_catalog_enrichment_job(second_job)), 'targeted claims preserve exhausted attempts';
  UPDATE public.catalog_enrichment_jobs SET status = 'processing', attempts = 2, updated_at = now() - interval '16 minutes' WHERE id = second_job;
  SELECT job_id INTO claimed FROM public.claim_catalog_enrichment_job(second_job);
  ASSERT claimed = second_job, 'interrupted work can be reclaimed';
END;
$$;

SELECT 'ok 1 - Studio claims and shared source leases preserve ownership, pacing and retries';
ROLLBACK;
