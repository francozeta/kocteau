BEGIN;
SELECT '1..1';
DO $$
DECLARE
  v_entity uuid;
  v_job uuid;
  v_track uuid;
  v_album uuid;
  v_recording uuid;
  v_proposal uuid;
BEGIN
  INSERT INTO public.entities(provider, provider_id, type, title)
    VALUES ('deezer', '998882', 'track', 'Three source fixture') RETURNING id INTO v_entity;
  INSERT INTO public.catalog_enrichment_jobs(target_type, target_id)
    VALUES ('entity', v_entity) RETURNING id INTO v_job;
  INSERT INTO public.catalog_source_observations(job_id, source, source_entity_type, source_entity_id, status, lookup)
    VALUES (v_job, 'deezer', 'track', '998882', 'resolved', '{}') RETURNING id INTO v_track;
  INSERT INTO public.catalog_source_observations(job_id, source, source_entity_type, source_entity_id, status, lookup)
    VALUES (v_job, 'deezer', 'album', '998883', 'resolved', '{}') RETURNING id INTO v_album;
  INSERT INTO public.catalog_source_observations(job_id, source, source_entity_type, source_entity_id, status, lookup)
    VALUES (v_job, 'musicbrainz', 'recording', 'a059e2c1-c13e-47e1-9a20-1e42fb0a6c8b', 'resolved', '{}') RETURNING id INTO v_recording;

  SELECT proposal_id INTO v_proposal FROM public.reserve_editorial_proposal(
    v_entity, NULL, repeat('d', 64), 'fixture', 3, '{}', ARRAY[v_track, v_album, v_recording], 0.01);
  ASSERT (SELECT count(*) = 3 FROM public.editorial_proposal_sources WHERE proposal_id = v_proposal);
  BEGIN
    PERFORM public.reserve_editorial_proposal(v_entity, NULL, repeat('e', 64), 'fixture', 3, '{}',
      ARRAY[v_track, v_album, v_recording, v_track], 0.01);
    RAISE EXCEPTION 'Four observations were accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END;
$$;
SELECT 'ok 1 - three versioned source observations are retained';
ROLLBACK;
