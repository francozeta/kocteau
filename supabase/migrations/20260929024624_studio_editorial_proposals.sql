CREATE TABLE public.editorial_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  prompt_version integer NOT NULL DEFAULT 1 CHECK (prompt_version > 0),
  model text NOT NULL,
  input_snapshot jsonb NOT NULL CHECK (jsonb_typeof(input_snapshot) = 'object'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'failed')),
  result jsonb CHECK (jsonb_typeof(result) = 'object'),
  error_code text CHECK (error_code IN ('unavailable', 'invalid_output', 'interrupted')),
  input_tokens integer CHECK (input_tokens >= 0),
  output_tokens integer CHECK (output_tokens >= 0),
  cost_usd numeric CHECK (cost_usd >= 0),
  estimated_max_cost_usd numeric NOT NULL CHECK (estimated_max_cost_usd BETWEEN 0 AND 0.02),
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CHECK (
    (status = 'pending' AND result IS NULL AND error_code IS NULL AND finished_at IS NULL) OR
    (status = 'complete' AND result IS NOT NULL AND error_code IS NULL AND finished_at IS NOT NULL) OR
    (status = 'failed' AND result IS NULL AND error_code IS NOT NULL AND finished_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX editorial_proposals_reuse_idx ON public.editorial_proposals(input_hash)
  WHERE status IN ('pending', 'complete');
CREATE INDEX editorial_proposals_entity_idx ON public.editorial_proposals(entity_id, created_at DESC);
CREATE INDEX editorial_proposals_created_idx ON public.editorial_proposals(created_at);
CREATE INDEX editorial_proposals_creator_idx ON public.editorial_proposals(created_by);

CREATE TABLE public.editorial_proposal_sources (
  proposal_id uuid NOT NULL REFERENCES public.editorial_proposals(id) ON DELETE RESTRICT,
  observation_id uuid NOT NULL REFERENCES public.catalog_source_observations(id) ON DELETE RESTRICT,
  PRIMARY KEY (proposal_id, observation_id)
);
CREATE INDEX editorial_proposal_sources_observation_idx ON public.editorial_proposal_sources(observation_id);

ALTER TABLE public.editorial_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_proposal_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.editorial_proposals, public.editorial_proposal_sources FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.editorial_proposals, public.editorial_proposal_sources TO service_role;
GRANT UPDATE (status, result, error_code, input_tokens, output_tokens, cost_usd, finished_at)
  ON public.editorial_proposals TO service_role;

CREATE FUNCTION public.reserve_editorial_proposal(
  p_entity_id uuid, p_created_by uuid, p_input_hash text, p_model text,
  p_prompt_version integer, p_input_snapshot jsonb, p_observation_ids uuid[],
  p_estimated_max_cost_usd numeric
) RETURNS TABLE (proposal_id uuid, created boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id uuid;
  v_now timestamptz := clock_timestamp();
BEGIN
  -- One shared quota across curators, processes, and deployments using this database.
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
  IF coalesce(cardinality(p_observation_ids), 0) NOT BETWEEN 1 AND 2 OR
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
REVOKE ALL ON FUNCTION public.reserve_editorial_proposal(uuid, uuid, text, text, integer, jsonb, uuid[], numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_editorial_proposal(uuid, uuid, text, text, integer, jsonb, uuid[], numeric)
  TO service_role;
