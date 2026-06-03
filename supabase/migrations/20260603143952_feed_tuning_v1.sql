-- Phase 5 feed tuning v1.
--
-- Goal:
-- - Reward written reviews without punishing mainstream taste.
-- - Reduce the influence of raw rating/recognition signals.
-- - Increase author/entity diversity pressure so familiar tracks do not
--   dominate For You by volume alone.
--
-- Run the baseline snapshot before applying this migration:
-- supabase/scripts/maintenance/feed-tuning-baseline-snapshot.sql

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

CREATE OR REPLACE FUNCTION public.get_recommended_review_ids(
  p_limit integer DEFAULT 8,
  p_cursor_score numeric DEFAULT NULL,
  p_cursor_created_at timestamp with time zone DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  review_id uuid,
  score numeric,
  reason text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
WITH viewer AS (
  SELECT auth.uid() AS user_id
),
bounded AS (
  SELECT greatest(1, least(coalesce(p_limit, 8), 30)) AS page_limit
),
explicit_preferences AS (
  SELECT
    upt.tag_id,
    sum(upt.weight) AS preference_weight
  FROM public.user_preference_tags upt
  JOIN viewer v ON v.user_id = upt.user_id
  GROUP BY upt.tag_id
),
positive_entities AS (
  SELECT
    entity_id,
    sum(signal_weight) AS signal_weight
  FROM (
    SELECT r.entity_id, greatest(0.2, r.rating / 5.0) * 1.6 AS signal_weight
    FROM public.reviews r
    JOIN viewer v ON v.user_id = r.author_id
    WHERE r.rating >= 3.5

    UNION ALL

    SELECT r.entity_id, 1.15 AS signal_weight
    FROM public.review_likes rl
    JOIN public.reviews r ON r.id = rl.review_id
    JOIN viewer v ON v.user_id = rl.user_id

    UNION ALL

    SELECT r.entity_id, 1.35 AS signal_weight
    FROM public.review_bookmarks rb
    JOIN public.reviews r ON r.id = rb.review_id
    JOIN viewer v ON v.user_id = rb.user_id

    UNION ALL

    SELECT eb.entity_id, 1.25 AS signal_weight
    FROM public.entity_bookmarks eb
    JOIN viewer v ON v.user_id = eb.user_id
  ) signals
  GROUP BY entity_id
),
negative_entities AS (
  SELECT DISTINCT r.entity_id
  FROM public.reviews r
  JOIN viewer v ON v.user_id = r.author_id
  WHERE r.rating <= 2
),
inferred_preferences AS (
  SELECT
    ept.tag_id,
    sum(least(pe.signal_weight, 4) * ept.weight * 0.7) AS preference_weight
  FROM positive_entities pe
  JOIN public.entity_preference_tags ept ON ept.entity_id = pe.entity_id
  GROUP BY ept.tag_id
),
taste_profile AS (
  SELECT
    tag_id,
    least(sum(preference_weight), 6) AS preference_weight
  FROM (
    SELECT tag_id, preference_weight
    FROM explicit_preferences

    UNION ALL

    SELECT tag_id, preference_weight
    FROM inferred_preferences
  ) preferences
  GROUP BY tag_id
),
followed_authors AS (
  SELECT pf.following_id AS author_id
  FROM public.profile_follows pf
  JOIN viewer v ON v.user_id = pf.follower_id
),
affinity_authors AS (
  SELECT
    author_id,
    least(sum(signal_weight), 5) AS affinity_weight
  FROM (
    SELECT r.author_id, 1.15 AS signal_weight
    FROM public.review_likes rl
    JOIN public.reviews r ON r.id = rl.review_id
    JOIN viewer v ON v.user_id = rl.user_id
    WHERE r.author_id <> v.user_id

    UNION ALL

    SELECT r.author_id, 1.35 AS signal_weight
    FROM public.review_bookmarks rb
    JOIN public.reviews r ON r.id = rb.review_id
    JOIN viewer v ON v.user_id = rb.user_id
    WHERE r.author_id <> v.user_id
  ) authors
  GROUP BY author_id
),
candidate_reviews AS (
  SELECT r.*
  FROM public.reviews r
  CROSS JOIN viewer v
  WHERE v.user_id IS NOT NULL
    AND r.author_id <> v.user_id
    AND r.created_at >= now() - interval '365 days'
),
entity_taste AS (
  SELECT
    r.id AS review_id,
    least(sum(tp.preference_weight * ept.weight), 6) AS entity_taste_score
  FROM candidate_reviews r
  JOIN public.entity_preference_tags ept ON ept.entity_id = r.entity_id
  JOIN taste_profile tp ON tp.tag_id = ept.tag_id
  GROUP BY r.id
),
author_taste AS (
  SELECT
    r.id AS review_id,
    least(sum(tp.preference_weight * upt.weight), 4) AS author_taste_score
  FROM candidate_reviews r
  JOIN public.user_preference_tags upt ON upt.user_id = r.author_id
  JOIN taste_profile tp ON tp.tag_id = upt.tag_id
  GROUP BY r.id
),
scored AS (
  SELECT
    r.id,
    r.author_id,
    r.entity_id,
    r.created_at,
    coalesce(et.entity_taste_score, 0) AS entity_taste_score,
    coalesce(at.author_taste_score, 0) AS author_taste_score,
    CASE WHEN fa.author_id IS NOT NULL THEN 1 ELSE 0 END AS follow_score,
    coalesce(pe.signal_weight, 0) AS familiar_entity_score,
    coalesce(aa.affinity_weight, 0) AS author_affinity_score,
    CASE WHEN ne.entity_id IS NOT NULL THEN 1 ELSE 0 END AS negative_entity_score,
    CASE
      WHEN char_length(trim(coalesce(r.body, ''))) >= 280 THEN 0.85
      WHEN char_length(trim(coalesce(r.body, ''))) >= 120 THEN 0.55
      WHEN nullif(trim(coalesce(r.body, '')), '') IS NOT NULL THEN 0.3
      WHEN nullif(trim(coalesce(r.title, '')), '') IS NOT NULL THEN 0.12
      ELSE 0
    END AS review_depth_score,
    (
      coalesce(et.entity_taste_score, 0) * 1.75
      + coalesce(at.author_taste_score, 0) * 0.9
      + CASE WHEN fa.author_id IS NOT NULL THEN 2.25 ELSE 0 END
      + least(coalesce(pe.signal_weight, 0), 4) * 1.15
      + coalesce(aa.affinity_weight, 0) * 0.6
      + greatest(0, r.rating - 3) * 0.22
      + ln(1 + greatest(r.likes_count, 0)) * 0.22
      + ln(1 + greatest(r.comments_count, 0)) * 0.24
      + (1 / (1 + greatest(extract(epoch FROM (now() - r.created_at)) / 86400, 0) / 21.0))
      - CASE WHEN ne.entity_id IS NOT NULL THEN 2.4 ELSE 0 END
    ) AS base_score
  FROM candidate_reviews r
  LEFT JOIN entity_taste et ON et.review_id = r.id
  LEFT JOIN author_taste at ON at.review_id = r.id
  LEFT JOIN followed_authors fa ON fa.author_id = r.author_id
  LEFT JOIN positive_entities pe ON pe.entity_id = r.entity_id
  LEFT JOIN affinity_authors aa ON aa.author_id = r.author_id
  LEFT JOIN negative_entities ne ON ne.entity_id = r.entity_id
),
diversified AS (
  SELECT
    scored.*,
    row_number() OVER (
      PARTITION BY scored.author_id
      ORDER BY (scored.base_score + scored.review_depth_score) DESC, scored.created_at DESC, scored.id DESC
    ) AS author_rank,
    row_number() OVER (
      PARTITION BY scored.entity_id
      ORDER BY (scored.base_score + scored.review_depth_score) DESC, scored.created_at DESC, scored.id DESC
    ) AS entity_rank
  FROM scored
),
finalized AS (
  SELECT
    d.id,
    d.created_at,
    round(greatest(
      d.base_score
      + d.review_depth_score
      - greatest(d.author_rank - 1, 0) * 0.55
      - greatest(d.entity_rank - 1, 0) * 0.95,
      0
    )::numeric, 4) AS final_score,
    CASE
      WHEN d.entity_taste_score >= greatest(
        d.author_taste_score,
        d.follow_score,
        d.familiar_entity_score,
        d.author_affinity_score,
        0.01
      ) THEN 'entity_taste'
      WHEN d.author_taste_score > 0 THEN 'taste_match'
      WHEN d.follow_score > 0 THEN 'following'
      WHEN d.familiar_entity_score > 0 THEN 'familiar_entity'
      WHEN d.author_affinity_score > 0 THEN 'author_affinity'
      ELSE 'popular_recent'
    END AS reason
  FROM diversified d
)
SELECT
  f.id AS review_id,
  f.final_score AS score,
  f.reason,
  f.created_at
FROM finalized f
CROSS JOIN bounded b
WHERE (
    p_cursor_score IS NULL
    OR f.final_score < p_cursor_score
    OR (
      f.final_score = p_cursor_score
      AND p_cursor_created_at IS NOT NULL
      AND f.created_at < p_cursor_created_at
    )
    OR (
      f.final_score = p_cursor_score
      AND p_cursor_created_at IS NOT NULL
      AND f.created_at = p_cursor_created_at
      AND p_cursor_id IS NOT NULL
      AND f.id < p_cursor_id
    )
  )
ORDER BY f.final_score DESC, f.created_at DESC, f.id DESC
LIMIT (SELECT page_limit + 1 FROM bounded);
$$;

REVOKE ALL ON FUNCTION public.get_recommended_review_ids(integer, numeric, timestamp with time zone, uuid)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_recommended_review_ids(integer, numeric, timestamp with time zone, uuid)
  TO authenticated;

COMMIT;
