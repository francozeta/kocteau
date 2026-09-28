BEGIN;

SELECT '1..1';

INSERT INTO public.entities (id, type, provider, provider_id, title, musicbrainz_synced_at)
SELECT (lpad(sequence::text, 8, '0') || '-cafe-4000-8000-000000000000')::uuid,
  'track', 'deezer', 'catalog-evidence-' || sequence, 'Catalog evidence fixture', NULL
FROM generate_series(1, 106) AS sequence;

INSERT INTO public.catalog_enrichment_jobs (target_type, target_id)
SELECT 'entity', id FROM public.entities WHERE provider = 'deezer' AND provider_id LIKE 'catalog-evidence-%'
ON CONFLICT (target_type, target_id) DO NOTHING;

UPDATE public.catalog_enrichment_jobs
SET status = 'failed', attempts = 5, last_error = 'provider unavailable',
  next_attempt_at = now() + interval '1 day'
WHERE target_type = 'entity' AND target_id IN (
  SELECT id FROM public.entities WHERE provider = 'deezer' AND provider_id LIKE 'catalog-evidence-%'
);

UPDATE public.catalog_enrichment_jobs SET attempts = 2
WHERE target_type = 'entity' AND target_id = '00000001-cafe-4000-8000-000000000000';
UPDATE public.catalog_enrichment_jobs SET status = 'pending', attempts = 1
WHERE target_type = 'entity' AND target_id = '00000002-cafe-4000-8000-000000000000';
UPDATE public.catalog_enrichment_jobs SET status = 'processing', attempts = 2
WHERE target_type = 'entity' AND target_id = '00000003-cafe-4000-8000-000000000000';
UPDATE public.catalog_enrichment_jobs SET status = 'complete'
WHERE target_type = 'entity' AND target_id = '00000105-cafe-4000-8000-000000000000';
DELETE FROM public.catalog_enrichment_jobs
WHERE target_type = 'entity' AND target_id = '00000106-cafe-4000-8000-000000000000';

DO $$
DECLARE
  v_job_id uuid;
BEGIN
  ASSERT NOT has_table_privilege('anon', 'public.catalog_source_observations', 'SELECT'),
    'anonymous clients cannot inspect evidence';
  ASSERT NOT has_table_privilege('authenticated', 'public.catalog_source_observations', 'INSERT'),
    'signed-in clients cannot fabricate evidence';
  ASSERT NOT has_table_privilege('authenticated', 'public.catalog_source_observations', 'SELECT'),
    'evidence has no direct browser read path';
  ASSERT has_table_privilege('service_role', 'public.catalog_source_observations', 'INSERT'),
    'the worker can append observations';
  ASSERT NOT has_table_privilege('service_role', 'public.catalog_source_observations', 'UPDATE'),
    'the worker cannot overwrite old observations';
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.catalog_source_observations'::regclass),
    'evidence requires RLS';

  PERFORM public.prepare_catalog_enrichment_jobs();

  ASSERT (SELECT attempts = 2 AND status = 'failed' AND last_error = 'provider unavailable'
      AND next_attempt_at > now()
    FROM public.catalog_enrichment_jobs
    WHERE target_type = 'entity' AND target_id = '00000001-cafe-4000-8000-000000000000'),
    'preparation preserves backoff and retry history';
  ASSERT (SELECT status = 'pending' AND attempts = 1 FROM public.catalog_enrichment_jobs
    WHERE target_type = 'entity' AND target_id = '00000002-cafe-4000-8000-000000000000'),
    'pending jobs are not reset';
  ASSERT (SELECT status = 'processing' AND attempts = 2 FROM public.catalog_enrichment_jobs
    WHERE target_type = 'entity' AND target_id = '00000003-cafe-4000-8000-000000000000'),
    'active jobs are not reset';
  ASSERT (SELECT status = 'failed' AND attempts = 5 FROM public.catalog_enrichment_jobs
    WHERE target_type = 'entity' AND target_id = '00000004-cafe-4000-8000-000000000000'),
    'exhausted jobs remain exhausted';
  ASSERT (SELECT status = 'pending' AND attempts = 0 AND last_error IS NULL
    FROM public.catalog_enrichment_jobs
    WHERE target_type = 'entity' AND target_id = '00000105-cafe-4000-8000-000000000000'),
    'completed stale targets refresh even behind more than 100 failed targets';
  ASSERT (SELECT status = 'pending' AND attempts = 0 FROM public.catalog_enrichment_jobs
    WHERE target_type = 'entity' AND target_id = '00000106-cafe-4000-8000-000000000000'),
    'new stale targets enter the queue';

  SELECT id INTO STRICT v_job_id FROM public.catalog_enrichment_jobs
  WHERE target_type = 'entity' AND target_id = '00000001-cafe-4000-8000-000000000000';

  INSERT INTO public.catalog_source_observations (
    job_id, source, source_entity_type, source_entity_id, status, lookup, facts, match_score
  ) VALUES (v_job_id, 'musicbrainz', 'recording', 'test-recording', 'resolved',
    '{"title":"Catalog evidence fixture"}', '{"tags":["dream pop"]}', 95);
  INSERT INTO public.catalog_source_observations (
    job_id, source, source_entity_type, status, lookup, error_code
  ) VALUES (v_job_id, 'musicbrainz', 'recording', 'failed',
    '{"title":"Catalog evidence fixture"}', 'request_failed');
  INSERT INTO public.catalog_source_observations (
    job_id, source, source_entity_type, status, lookup
  ) VALUES (v_job_id, 'musicbrainz', 'recording', 'no_match',
    '{"title":"Catalog evidence fixture"}');

  ASSERT (SELECT count(*) = 3 FROM public.catalog_source_observations WHERE job_id = v_job_id),
    'later failures and no-match results preserve successful evidence';

  BEGIN
    INSERT INTO public.catalog_source_observations (
      job_id, source, source_entity_type, status, lookup
    ) VALUES (v_job_id, 'musicbrainz', 'recording', 'resolved', '{}');
    RAISE EXCEPTION 'resolved evidence must identify its source entity';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.catalog_source_observations (
      job_id, source, source_entity_type, status, lookup, facts
    ) VALUES (v_job_id, 'musicbrainz', 'recording', 'no_match', '{}', '{"tags":["dream pop"]}');
    RAISE EXCEPTION 'unmatched sources must not carry facts';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.catalog_source_observations (
      job_id, source, source_entity_type, status, lookup
    ) VALUES (v_job_id, 'musicbrainz', 'recording', 'failed', '{}');
    RAISE EXCEPTION 'failures require a safe error code';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END;
$$;

SELECT 'ok 1 - source provenance, access boundaries, and bounded queue retries';

ROLLBACK;
