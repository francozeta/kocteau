-- Context-aware starter picks for editorial rails and sparse For You states.
--
-- Run from the Supabase SQL editor after
-- 20260531160852_editorial_starter_layer.sql.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

DROP FUNCTION IF EXISTS public.get_starter_tracks_for_surface(
  integer,
  text,
  text,
  text[]
);

CREATE OR REPLACE FUNCTION public.get_starter_tracks_for_surface(
  p_limit integer DEFAULT 6,
  p_surface text DEFAULT 'home',
  p_context_key text DEFAULT NULL,
  p_exclude_provider_ids text[] DEFAULT '{}'::text[]
)
RETURNS TABLE (
  id uuid,
  provider text,
  provider_id text,
  type public.entity_type,
  title text,
  artist_name text,
  cover_url text,
  deezer_url text,
  prompt text,
  editorial_note text,
  collection_slug text,
  collection_title text,
  matched_tag_count integer,
  score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
WITH bounded AS (
  SELECT
    greatest(1, least(coalesce(p_limit, 6), 12)) AS page_limit,
    left(coalesce(nullif(btrim(lower(p_surface)), ''), 'home'), 48) AS surface,
    left(coalesce(nullif(btrim(lower(p_context_key)), ''), 'global'), 120) AS context_key,
    coalesce(p_exclude_provider_ids, '{}'::text[]) AS excluded_provider_ids,
    auth.uid() AS viewer_id
),
viewer_tags AS (
  SELECT
    upt.tag_id,
    greatest(upt.weight, 0.1) AS preference_weight
  FROM public.user_preference_tags upt
  CROSS JOIN bounded
  WHERE bounded.viewer_id IS NOT NULL
    AND upt.user_id = bounded.viewer_id
),
ranked AS (
  SELECT
    st.id,
    st.provider,
    st.provider_id,
    st.type,
    st.title,
    st.artist_name,
    st.cover_url,
    st.deezer_url,
    st.prompt,
    st.editorial_note,
    (
      array_agg(ec.slug ORDER BY ec.sort_order, eci.position)
        FILTER (WHERE ec.id IS NOT NULL)
    )[1] AS collection_slug,
    (
      array_agg(ec.title ORDER BY ec.sort_order, eci.position)
        FILTER (WHERE ec.id IS NOT NULL)
    )[1] AS collection_title,
    count(DISTINCT vt.tag_id)::integer AS matched_tag_count,
    (
      coalesce(sum(vt.preference_weight * stt.weight), 0)
      + CASE WHEN st.is_featured THEN 0.35 ELSE 0 END
      + CASE WHEN bool_or(ec.id IS NOT NULL) THEN 0.2 ELSE 0 END
    )::numeric AS base_score,
    (
      get_byte(
        decode(
          substr(
            md5(
              st.id::text
              || ':'
              || coalesce(bounded.viewer_id::text, 'anon')
              || ':'
              || bounded.surface
              || ':'
              || bounded.context_key
              || ':'
              || current_date::text
            ),
            1,
            2
          ),
          'hex'
        ),
        0
      )::numeric / 255.0
    ) AS rotation_score,
    CASE
      WHEN bounded.surface IN ('track', 'profile', 'review') THEN 0.45
      WHEN bounded.surface IN ('studio', 'search', 'saved', 'notifications', 'activity', 'home') THEN 0.28
      ELSE 0.18
    END AS rotation_weight,
    coalesce(
      min(eci.position) FILTER (WHERE ec.id IS NOT NULL),
      st.sort_order
    ) AS editorial_position,
    st.is_featured,
    st.sort_order,
    st.created_at
  FROM public.starter_tracks st
  CROSS JOIN bounded
  LEFT JOIN public.starter_track_tags stt
    ON stt.starter_track_id = st.id
  LEFT JOIN viewer_tags vt
    ON vt.tag_id = stt.tag_id
  LEFT JOIN public.editorial_collection_items eci
    ON eci.starter_track_id = st.id
  LEFT JOIN public.editorial_collections ec
    ON ec.id = eci.collection_id
    AND ec.is_published
  WHERE st.is_active
    AND NOT (st.provider_id = ANY(bounded.excluded_provider_ids))
    AND NOT EXISTS (
      SELECT 1
      FROM public.entities reviewed_entity
      JOIN public.reviews viewer_review
        ON viewer_review.entity_id = reviewed_entity.id
      WHERE bounded.viewer_id IS NOT NULL
        AND viewer_review.author_id = bounded.viewer_id
        AND reviewed_entity.provider = st.provider
        AND reviewed_entity.provider_id = st.provider_id
        AND reviewed_entity.type = st.type
    )
  GROUP BY
    st.id,
    st.provider,
    st.provider_id,
    st.type,
    st.title,
    st.artist_name,
    st.cover_url,
    st.deezer_url,
    st.prompt,
    st.editorial_note,
    st.is_featured,
    st.sort_order,
    st.created_at,
    bounded.viewer_id,
    bounded.surface,
    bounded.context_key
)
SELECT
  ranked.id,
  ranked.provider,
  ranked.provider_id,
  ranked.type,
  ranked.title,
  ranked.artist_name,
  ranked.cover_url,
  ranked.deezer_url,
  ranked.prompt,
  ranked.editorial_note,
  ranked.collection_slug,
  ranked.collection_title,
  ranked.matched_tag_count,
  (ranked.base_score + ranked.rotation_score * ranked.rotation_weight)::numeric AS score
FROM ranked
CROSS JOIN bounded
ORDER BY
  (ranked.base_score + ranked.rotation_score * ranked.rotation_weight) DESC,
  ranked.matched_tag_count DESC,
  ranked.is_featured DESC,
  ranked.editorial_position ASC,
  ranked.sort_order ASC,
  ranked.created_at DESC,
  ranked.id DESC
LIMIT (SELECT page_limit FROM bounded);
$$;

REVOKE ALL ON FUNCTION public.get_starter_tracks_for_surface(
  integer,
  text,
  text,
  text[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_starter_tracks_for_surface(
  integer,
  text,
  text,
  text[]
) TO authenticated;

COMMIT;
