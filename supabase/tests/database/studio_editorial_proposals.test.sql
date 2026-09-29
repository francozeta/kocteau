BEGIN;
SELECT '1..1';
DO $$
DECLARE
  v_entity uuid;
  v_job uuid;
  v_observation uuid;
  v_proposal uuid;
  v_same uuid;
  v_created boolean;
BEGIN
  ASSERT NOT has_table_privilege('authenticated', 'public.editorial_proposals', 'SELECT');
  ASSERT NOT has_table_privilege('anon', 'public.editorial_proposal_sources', 'INSERT');
  ASSERT NOT has_function_privilege('authenticated',
    'public.reserve_editorial_proposal(uuid,uuid,text,text,integer,jsonb,uuid[],numeric)', 'EXECUTE');
  ASSERT has_function_privilege('service_role',
    'public.reserve_editorial_proposal(uuid,uuid,text,text,integer,jsonb,uuid[],numeric)', 'EXECUTE');
  ASSERT NOT has_column_privilege('service_role', 'public.editorial_proposals', 'input_snapshot', 'UPDATE');
  ASSERT has_column_privilege('service_role', 'public.editorial_proposals', 'result', 'UPDATE');

  INSERT INTO public.entities(provider, provider_id, type, title) VALUES ('deezer', '998881', 'track', 'Proposal fixture') RETURNING id INTO v_entity;
  INSERT INTO public.catalog_enrichment_jobs(target_type, target_id) VALUES ('entity', v_entity) RETURNING id INTO v_job;
  INSERT INTO public.catalog_source_observations(job_id, source, source_entity_type, source_entity_id, status, lookup)
    VALUES (v_job, 'deezer', 'track', '998881', 'resolved', '{}') RETURNING id INTO v_observation;

  SELECT proposal_id, created INTO v_proposal, v_created FROM public.reserve_editorial_proposal(
    v_entity, NULL, repeat('a', 64), 'fixture', 1, '{}', ARRAY[v_observation], 0.01);
  ASSERT v_created;
  SELECT proposal_id, created INTO v_same, v_created FROM public.reserve_editorial_proposal(
    v_entity, NULL, repeat('a', 64), 'fixture', 1, '{}', ARRAY[v_observation], 0.01);
  ASSERT NOT v_created AND v_same = v_proposal;
  BEGIN
    DELETE FROM public.catalog_source_observations WHERE id = v_observation;
    RAISE EXCEPTION 'Referenced evidence was deleted';
  EXCEPTION WHEN foreign_key_violation OR restrict_violation THEN NULL; END;
  BEGIN
    PERFORM public.reserve_editorial_proposal(v_entity, NULL, repeat('b', 64), 'fixture', 1, '{}', ARRAY[gen_random_uuid()], 0.01);
    RAISE EXCEPTION 'Unrelated evidence was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;

  UPDATE public.editorial_proposals SET created_at = now() - interval '3 minutes' WHERE id = v_proposal;
  SELECT proposal_id, created INTO v_same, v_created FROM public.reserve_editorial_proposal(
    v_entity, NULL, repeat('a', 64), 'fixture', 1, '{}', ARRAY[v_observation], 0.01);
  ASSERT v_created AND v_same <> v_proposal;
  ASSERT (SELECT error_code = 'interrupted' FROM public.editorial_proposals WHERE id = v_proposal);
  UPDATE public.editorial_proposals SET status = 'failed', error_code = 'unavailable', finished_at = now() WHERE id = v_same;
  BEGIN
    PERFORM public.reserve_editorial_proposal(v_entity, NULL, repeat('a', 64), 'fixture', 1, '{}', ARRAY[v_observation], 0.01);
    RAISE EXCEPTION 'Retry backoff was ignored';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN ASSERT SQLERRM = 'proposal_retry_later'; END;

  FOR i IN 1..48 LOOP
    PERFORM public.reserve_editorial_proposal(v_entity, NULL, lpad(to_hex(i), 64, '0'), 'fixture', 1, '{}', ARRAY[v_observation], 0.01);
  END LOOP;
  BEGIN
    PERFORM public.reserve_editorial_proposal(v_entity, NULL, repeat('c', 64), 'fixture', 1, '{}', ARRAY[v_observation], 0.01);
    RAISE EXCEPTION 'Monthly limit was ignored';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN ASSERT SQLERRM = 'proposal_monthly_limit'; END;
  ASSERT (SELECT count(*) = 50 FROM public.editorial_proposals WHERE entity_id = v_entity);
END;
$$;
SELECT 'ok 1 - proposals preserve evidence, deduplicate and bound all attempts';
ROLLBACK;
