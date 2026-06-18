-- Give starter source imports a recurring discovery lane in rails.
--
-- The function still returns p_limit rows, but reserves a small portion of the
-- visible slots for active starter sources such as Apple Music playlist mirrors.
-- This lets imported curation breathe over time without making every rail purely
-- random or replacing taste-based ranking.

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
lane_config AS (
  SELECT
    bounded.page_limit,
    greatest(
      1,
      least(4, ceiling(bounded.page_limit::numeric / 3)::integer)
    ) AS source_quota
  FROM bounded
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
active_source_items AS (
  SELECT
    item.starter_track_id,
    min(item.source_position) AS source_position,
    max(item.last_seen_at) AS last_seen_at
  FROM public.starter_source_items item
  JOIN public.starter_sources source
    ON source.id = item.source_id
    AND source.is_active
  WHERE item.status = 'synced'
    AND item.starter_track_id IS NOT NULL
    AND item.removed_at IS NULL
  GROUP BY item.starter_track_id
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
      + CASE WHEN source_item.starter_track_id IS NOT NULL THEN 0.08 ELSE 0 END
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
    (
      get_byte(
        decode(
          substr(
            md5(
              st.id::text
              || ':source:'
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
    ) AS source_rotation_score,
    CASE
      WHEN bounded.surface IN ('track', 'profile', 'review') THEN 0.45
      WHEN bounded.surface IN ('studio', 'search', 'saved', 'notifications', 'activity', 'home') THEN 0.28
      ELSE 0.18
    END AS rotation_weight,
    coalesce(
      min(eci.position) FILTER (WHERE ec.id IS NOT NULL),
      st.sort_order
    ) AS editorial_position,
    source_item.source_position,
    source_item.last_seen_at AS source_last_seen_at,
    (source_item.starter_track_id IS NOT NULL) AS has_active_source,
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
  LEFT JOIN active_source_items source_item
    ON source_item.starter_track_id = st.id
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
    bounded.context_key,
    source_item.starter_track_id,
    source_item.source_position,
    source_item.last_seen_at
),
scored_base AS (
  SELECT
    ranked.*,
    (ranked.base_score + ranked.rotation_score * ranked.rotation_weight)::numeric AS score,
    (
      ranked.base_score * 0.45
      + ranked.source_rotation_score * 0.55
    )::numeric AS source_score
  FROM ranked
),
scored AS (
  SELECT
    scored_base.*,
    row_number() OVER (
      ORDER BY
        scored_base.score DESC,
        scored_base.matched_tag_count DESC,
        scored_base.is_featured DESC,
        scored_base.editorial_position ASC,
        scored_base.sort_order ASC,
        scored_base.created_at DESC,
        scored_base.id DESC
    ) AS personalized_rank,
    row_number() OVER (
      PARTITION BY scored_base.has_active_source
      ORDER BY
        scored_base.source_score DESC,
        scored_base.source_position ASC NULLS LAST,
        scored_base.source_last_seen_at DESC NULLS LAST,
        scored_base.created_at DESC,
        scored_base.id DESC
    ) AS source_rank
  FROM scored_base
),
selected AS (
  SELECT
    scored.*,
    1 AS lane_priority,
    (scored.source_rank * 3) AS lane_order
  FROM scored
  CROSS JOIN lane_config
  WHERE scored.has_active_source
    AND scored.source_rank <= lane_config.source_quota

  UNION ALL

  SELECT
    scored.*,
    2 AS lane_priority,
    (
      scored.personalized_rank
      + floor((scored.personalized_rank - 1)::numeric / 2)::integer
    ) AS lane_order
  FROM scored
  CROSS JOIN lane_config
  WHERE scored.personalized_rank <= lane_config.page_limit + lane_config.source_quota
),
deduped AS (
  SELECT DISTINCT ON (selected.id)
    selected.*
  FROM selected
  ORDER BY
    selected.id,
    selected.lane_priority ASC,
    selected.score DESC
)
SELECT
  deduped.id,
  deduped.provider,
  deduped.provider_id,
  deduped.type,
  deduped.title,
  deduped.artist_name,
  deduped.cover_url,
  deduped.deezer_url,
  deduped.prompt,
  deduped.editorial_note,
  deduped.collection_slug,
  deduped.collection_title,
  deduped.matched_tag_count,
  deduped.score
FROM deduped
ORDER BY
  deduped.lane_order ASC,
  deduped.score DESC,
  deduped.id DESC
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
