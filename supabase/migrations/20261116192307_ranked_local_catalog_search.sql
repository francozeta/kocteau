BEGIN;

-- Keep title/artist branches independently recoverable; only order each bounded pool.

CREATE OR REPLACE FUNCTION public.search_local_entities(p_query text, p_type public.entity_type, p_field text, p_limit integer DEFAULT 18)
RETURNS TABLE (id uuid, provider text, provider_id text, type public.entity_type, title text, artist_name text, cover_url text, deezer_url text, release_date date, record_type text, disambiguation text, first_release_date text, genres text[])
LANGUAGE sql
STABLE
SECURITY INVOKER
ROWS 18
SET search_path = ''
AS $function$
  WITH input AS (
    SELECT replace(replace(replace(p_query, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') AS pattern
    WHERE length(p_query) BETWEEN 1 AND 80 AND p_field IN ('title', 'artist_name')
  )
  SELECT e.id, e.provider, e.provider_id, e.type, e.title, e.artist_name, e.cover_url, e.deezer_url, e.release_date, e.record_type, e.disambiguation, e.first_release_date, e.genres
  FROM public.entities e
  CROSS JOIN input i
  CROSS JOIN LATERAL (SELECT CASE p_field WHEN 'title' THEN e.title WHEN 'artist_name' THEN e.artist_name END AS value) match
  WHERE e.provider = 'deezer' AND e.type = p_type
    AND match.value ILIKE '%' || i.pattern || '%' ESCAPE E'\\'
  ORDER BY CASE
      WHEN match.value ILIKE i.pattern ESCAPE E'\\' THEN 0
      WHEN match.value ILIKE i.pattern || '%' ESCAPE E'\\' THEN 1
      ELSE 2
    END,
    lower(match.value) COLLATE "C", e.id
  LIMIT greatest(0, least(coalesce(p_limit, 18), 18));
$function$;

REVOKE ALL ON FUNCTION public.search_local_entities(text, public.entity_type, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_local_entities(text, public.entity_type, text, integer) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.search_local_artists(p_query text, p_limit integer DEFAULT 18)
RETURNS TABLE (id uuid, provider text, provider_id text, name text, image_url text, deezer_url text, artist_type text, country_code text, disambiguation text, genres text[])
LANGUAGE sql
STABLE
SECURITY INVOKER
ROWS 18
SET search_path = ''
AS $function$
  WITH input AS (
    SELECT replace(replace(replace(p_query, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') AS pattern
    WHERE length(p_query) BETWEEN 1 AND 80
  )
  SELECT e.id, e.provider, e.provider_id, e.name, e.image_url, e.deezer_url, e.artist_type, e.country_code, e.disambiguation, e.genres
  FROM public.artists e
  CROSS JOIN input i
  CROSS JOIN LATERAL (SELECT e.name AS value) match
  WHERE e.provider = 'deezer'
    AND match.value ILIKE '%' || i.pattern || '%' ESCAPE E'\\'
  ORDER BY CASE
      WHEN match.value ILIKE i.pattern ESCAPE E'\\' THEN 0
      WHEN match.value ILIKE i.pattern || '%' ESCAPE E'\\' THEN 1
      ELSE 2
    END,
    lower(match.value) COLLATE "C", e.id
  LIMIT greatest(0, least(coalesce(p_limit, 18), 18));
$function$;

REVOKE ALL ON FUNCTION public.search_local_artists(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_local_artists(text, integer) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.search_local_starter_tracks(p_query text, p_field text, p_limit integer DEFAULT 18)
RETURNS TABLE (id uuid, provider text, provider_id text, type public.entity_type, title text, artist_name text, cover_url text, deezer_url text)
LANGUAGE sql
STABLE
SECURITY INVOKER
ROWS 18
SET search_path = ''
AS $function$
  WITH input AS (
    SELECT replace(replace(replace(p_query, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') AS pattern
    WHERE length(p_query) BETWEEN 1 AND 80 AND p_field IN ('title', 'artist_name')
  )
  SELECT e.id, e.provider, e.provider_id, e.type, e.title, e.artist_name, e.cover_url, e.deezer_url
  FROM public.starter_tracks e
  CROSS JOIN input i
  CROSS JOIN LATERAL (SELECT CASE p_field WHEN 'title' THEN e.title WHEN 'artist_name' THEN e.artist_name END AS value) match
  WHERE e.provider = 'deezer' AND e.type = 'track' AND e.is_active
    AND match.value ILIKE '%' || i.pattern || '%' ESCAPE E'\\'
  ORDER BY CASE
      WHEN match.value ILIKE i.pattern ESCAPE E'\\' THEN 0
      WHEN match.value ILIKE i.pattern || '%' ESCAPE E'\\' THEN 1
      ELSE 2
    END,
    e.sort_order, lower(match.value) COLLATE "C", e.id
  LIMIT greatest(0, least(coalesce(p_limit, 18), 18));
$function$;

REVOKE ALL ON FUNCTION public.search_local_starter_tracks(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_local_starter_tracks(text, text, integer) TO anon, authenticated;


COMMIT;
