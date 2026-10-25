BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

-- Keep recommendation scoring in its existing bounded RPC. This read model
-- combines card hydration and viewer state in the same authenticated snapshot.
CREATE OR REPLACE FUNCTION public.get_recommended_feed_bundle(
  p_limit integer DEFAULT 8,
  p_cursor_score numeric DEFAULT NULL,
  p_cursor_created_at timestamp with time zone DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  body text,
  rating numeric,
  likes_count integer,
  comments_count integer,
  created_at timestamp with time zone,
  entities jsonb,
  author jsonb,
  recommendation_score numeric,
  recommendation_reason text,
  viewer_has_liked boolean,
  viewer_has_bookmarked boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
WITH bounded AS (
  SELECT greatest(1, least(coalesce(p_limit, 8), 30)) AS page_limit
),
recommendations AS MATERIALIZED (
  SELECT rec.review_id, rec.score, rec.reason, rec.position
  FROM bounded b
  CROSS JOIN LATERAL public.get_recommended_review_ids(
    b.page_limit + 1, p_cursor_score, p_cursor_created_at, p_cursor_id
  ) WITH ORDINALITY AS rec(review_id, score, reason, created_at, position)
),
own_recent AS (
  SELECT own.id AS review_id, row_number() OVER (
    ORDER BY own.created_at DESC, own.id DESC
  ) AS position
  FROM (
    SELECT r.id, r.created_at
    FROM public.reviews r
    WHERE r.author_id = (SELECT auth.uid())
      AND p_cursor_id IS NULL
      AND p_cursor_created_at IS NULL
    ORDER BY r.created_at DESC, r.id DESC
    LIMIT 2
  ) own
),
candidates AS (
  SELECT own.review_id, 1000::numeric AS score, 'own_review'::text AS reason,
    0 AS priority, own.position
  FROM own_recent own
  UNION ALL
  SELECT rec.review_id, rec.score, rec.reason, 1 AS priority, rec.position
  FROM recommendations rec
),
deduplicated AS (
  SELECT DISTINCT ON (candidate.review_id) candidate.*
  FROM candidates candidate
  ORDER BY candidate.review_id, candidate.priority, candidate.position
)
SELECT
  r.id, r.title, r.body, r.rating::numeric,
  r.likes_count::integer, r.comments_count::integer, r.created_at,
  CASE WHEN e.id IS NULL THEN NULL ELSE jsonb_build_object(
    'id', e.id, 'provider', e.provider, 'provider_id', e.provider_id,
    'type', e.type, 'title', e.title, 'artist_name', e.artist_name,
    'cover_url', e.cover_url, 'deezer_url', e.deezer_url
  ) END AS entities,
  CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object(
    'id', a.id, 'username', a.username, 'display_name', a.display_name,
    'avatar_url', a.avatar_url
  ) END AS author,
  candidate.score, candidate.reason,
  EXISTS (
    SELECT 1 FROM public.review_likes rl
    WHERE rl.review_id = r.id AND rl.user_id = (SELECT auth.uid())
  ) AS viewer_has_liked,
  EXISTS (
    SELECT 1 FROM public.review_bookmarks rb
    WHERE rb.review_id = r.id AND rb.user_id = (SELECT auth.uid())
  ) AS viewer_has_bookmarked
FROM deduplicated candidate
JOIN public.reviews r ON r.id = candidate.review_id
LEFT JOIN public.entities e ON e.id = r.entity_id
LEFT JOIN public.profiles a ON a.id = r.author_id
ORDER BY candidate.priority, candidate.position;
$$;

REVOKE ALL ON FUNCTION public.get_recommended_feed_bundle(integer, numeric, timestamp with time zone, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recommended_feed_bundle(integer, numeric, timestamp with time zone, uuid)
  TO authenticated;
COMMENT ON FUNCTION public.get_recommended_feed_bundle(integer, numeric, timestamp with time zone, uuid)
  IS 'Authenticated For You cards and viewer state using existing bounded ranking; no viewer-id input.';

COMMIT;
