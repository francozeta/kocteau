CREATE OR REPLACE FUNCTION public.enqueue_catalog_enrichment_target(
  p_target_type text,
  p_target_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_target_type NOT IN ('artist', 'entity') THEN
    RAISE EXCEPTION 'Unsupported catalog enrichment target type: %', p_target_type;
  END IF;

  INSERT INTO public.catalog_enrichment_jobs (
    target_type,
    target_id,
    status,
    attempts,
    next_attempt_at,
    last_error
  )
  VALUES (p_target_type, p_target_id, 'pending', 0, now(), NULL)
  ON CONFLICT (target_type, target_id)
  DO UPDATE SET
    status = 'pending',
    attempts = 0,
    next_attempt_at = now(),
    last_error = NULL,
    updated_at = now()
  WHERE public.catalog_enrichment_jobs.status <> 'processing';
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_catalog_enrichment_target(text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_catalog_enrichment_target(text, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.reset_artist_musicbrainz_context()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.provider IS DISTINCT FROM OLD.provider
     OR NEW.provider_id IS DISTINCT FROM OLD.provider_id
     OR NEW.name IS DISTINCT FROM OLD.name THEN
    NEW.musicbrainz_id := NULL;
    NEW.musicbrainz_match_score := NULL;
    NEW.artist_type := NULL;
    NEW.country_code := NULL;
    NEW.disambiguation := NULL;
    NEW.life_span_begin := NULL;
    NEW.life_span_end := NULL;
    NEW.genres := '{}'::text[];
    NEW.musicbrainz_synced_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_entity_musicbrainz_context()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.provider IS DISTINCT FROM OLD.provider
     OR NEW.provider_id IS DISTINCT FROM OLD.provider_id
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.artist_name IS DISTINCT FROM OLD.artist_name THEN
    NEW.musicbrainz_recording_id := NULL;
    NEW.musicbrainz_release_group_id := NULL;
    NEW.musicbrainz_match_score := NULL;
    NEW.disambiguation := NULL;
    NEW.first_release_date := NULL;
    NEW.genres := '{}'::text[];
    NEW.musicbrainz_synced_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_artist_musicbrainz_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.provider IS DISTINCT FROM OLD.provider
     OR NEW.provider_id IS DISTINCT FROM OLD.provider_id
     OR NEW.name IS DISTINCT FROM OLD.name THEN
    PERFORM public.enqueue_catalog_enrichment_target('artist', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_entity_musicbrainz_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.provider IS DISTINCT FROM OLD.provider
     OR NEW.provider_id IS DISTINCT FROM OLD.provider_id
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.artist_name IS DISTINCT FROM OLD.artist_name THEN
    PERFORM public.enqueue_catalog_enrichment_target('entity', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_artist_musicbrainz_context()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_entity_musicbrainz_context()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_artist_musicbrainz_context()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_entity_musicbrainz_context()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reset_artist_musicbrainz_context_on_identity_change
  ON public.artists;
CREATE TRIGGER reset_artist_musicbrainz_context_on_identity_change
BEFORE UPDATE OF provider, provider_id, name ON public.artists
FOR EACH ROW
EXECUTE FUNCTION public.reset_artist_musicbrainz_context();

DROP TRIGGER IF EXISTS reset_entity_musicbrainz_context_on_identity_change
  ON public.entities;
CREATE TRIGGER reset_entity_musicbrainz_context_on_identity_change
BEFORE UPDATE OF provider, provider_id, type, title, artist_name ON public.entities
FOR EACH ROW
EXECUTE FUNCTION public.reset_entity_musicbrainz_context();

DROP TRIGGER IF EXISTS queue_artist_musicbrainz_context_on_change
  ON public.artists;
CREATE TRIGGER queue_artist_musicbrainz_context_on_change
AFTER INSERT OR UPDATE OF provider, provider_id, name ON public.artists
FOR EACH ROW
EXECUTE FUNCTION public.queue_artist_musicbrainz_context();

DROP TRIGGER IF EXISTS queue_entity_musicbrainz_context_on_change
  ON public.entities;
CREATE TRIGGER queue_entity_musicbrainz_context_on_change
AFTER INSERT OR UPDATE OF provider, provider_id, type, title, artist_name
ON public.entities
FOR EACH ROW
EXECUTE FUNCTION public.queue_entity_musicbrainz_context();

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
    SELECT
      'artist'::text AS target_type,
      artist.id AS target_id,
      artist.musicbrainz_synced_at AS synced_at
    FROM public.artists AS artist
    WHERE artist.musicbrainz_synced_at IS NULL
       OR artist.musicbrainz_synced_at < now() - interval '90 days'

    UNION ALL

    SELECT
      'entity'::text AS target_type,
      entity.id AS target_id,
      entity.musicbrainz_synced_at AS synced_at
    FROM public.entities AS entity
    WHERE entity.musicbrainz_synced_at IS NULL
       OR entity.musicbrainz_synced_at < now() - interval '90 days'
  ),
  candidates AS (
    SELECT target_type, target_id
    FROM stale_targets
    ORDER BY synced_at ASC NULLS FIRST, target_id
    LIMIT 100
  ),
  prepared AS (
    INSERT INTO public.catalog_enrichment_jobs (
      target_type,
      target_id,
      status,
      attempts,
      next_attempt_at,
      last_error
    )
    SELECT
      candidate.target_type,
      candidate.target_id,
      'pending',
      0,
      now(),
      NULL
    FROM candidates AS candidate
    ON CONFLICT (target_type, target_id)
    DO UPDATE SET
      status = 'pending',
      attempts = 0,
      next_attempt_at = now(),
      last_error = NULL,
      updated_at = now()
    WHERE public.catalog_enrichment_jobs.status <> 'processing'
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_prepared
  FROM prepared;

  RETURN coalesce(v_prepared, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_catalog_enrichment_jobs()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_catalog_enrichment_jobs()
  TO service_role;

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
    WHERE job.attempts < 5
      AND (
        (
          job.status IN ('pending', 'failed')
          AND job.next_attempt_at <= now()
        )
        OR (
          job.status = 'processing'
          AND job.updated_at <= now() - interval '15 minutes'
        )
      )
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

REVOKE ALL ON FUNCTION public.claim_catalog_enrichment_job()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_catalog_enrichment_job()
  TO service_role;
