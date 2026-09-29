CREATE OR REPLACE FUNCTION public.reserve_editorial_proposal(
  p_entity_id uuid, p_created_by uuid, p_input_hash text, p_model text,
  p_prompt_version integer, p_input_snapshot jsonb, p_observation_ids uuid[],
  p_estimated_max_cost_usd numeric
) RETURNS TABLE (proposal_id uuid, created boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id uuid;
  v_now timestamptz := clock_timestamp();
BEGIN
  PERFORM pg_advisory_xact_lock(72641, 3);
  UPDATE public.editorial_proposals SET status = 'failed', error_code = 'interrupted', finished_at = v_now
    WHERE status = 'pending' AND created_at < v_now - interval '2 minutes';

  SELECT id INTO v_id FROM public.editorial_proposals
    WHERE input_hash = p_input_hash AND status IN ('pending', 'complete');
  IF v_id IS NOT NULL THEN RETURN QUERY SELECT v_id, false; RETURN; END IF;

  IF (SELECT count(*) FROM public.editorial_proposals
      WHERE created_at >= date_trunc('month', v_now AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') >= 50 THEN
    RAISE EXCEPTION 'proposal_monthly_limit' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.editorial_proposals
      WHERE input_hash = p_input_hash AND created_at > v_now - interval '1 minute') THEN
    RAISE EXCEPTION 'proposal_retry_later' USING ERRCODE = 'P0001';
  END IF;
  IF coalesce(cardinality(p_observation_ids), 0) NOT BETWEEN 1 AND 3 OR
     (SELECT count(DISTINCT o.id) FROM public.catalog_source_observations o
       JOIN public.catalog_enrichment_jobs j ON j.id = o.job_id
       WHERE o.id = ANY(p_observation_ids) AND j.target_type = 'entity' AND j.target_id = p_entity_id)
       <> cardinality(p_observation_ids) THEN
    RAISE EXCEPTION 'invalid_proposal_evidence' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.editorial_proposals(entity_id, created_by, input_hash, model, prompt_version,
    input_snapshot, estimated_max_cost_usd)
  VALUES (p_entity_id, p_created_by, p_input_hash, p_model, p_prompt_version,
    p_input_snapshot, p_estimated_max_cost_usd) RETURNING id INTO v_id;
  INSERT INTO public.editorial_proposal_sources(proposal_id, observation_id)
    SELECT v_id, unnest(p_observation_ids);
  RETURN QUERY SELECT v_id, true;
END;
$$;
