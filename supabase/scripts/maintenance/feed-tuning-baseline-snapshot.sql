-- Kocteau feed tuning baseline snapshot.
-- Read-only aggregate queries for maintainers before changing
-- get_recommended_review_ids().
--
-- Run in the Supabase SQL editor before a Phase 5 ranking change, then run
-- again 7-14 days after deployment. Do not export raw analytics rows.

-- 1. Daily For You health.
SELECT
  date_trunc('day', created_at) AS day,
  count(*) FILTER (WHERE event_type = 'feed_loaded') AS feed_loads,
  count(*) FILTER (WHERE event_type = 'recommendation_fallback') AS fallbacks,
  count(*) FILTER (WHERE event_type = 'review_impression') AS review_impressions,
  count(*) FILTER (WHERE event_type = 'review_open') AS review_opens,
  count(*) FILTER (WHERE event_type IN ('review_read_50', 'review_read_90')) AS review_reads,
  count(*) FILTER (WHERE event_type = 'for_you_review_action') AS review_actions,
  round(
    count(*) FILTER (WHERE event_type = 'recommendation_fallback')::numeric
    / nullif(count(*) FILTER (WHERE event_type = 'feed_loaded'), 0),
    4
  ) AS fallback_rate,
  round(
    count(*) FILTER (WHERE event_type = 'review_open')::numeric
    / nullif(count(*) FILTER (WHERE event_type = 'review_impression'), 0),
    4
  ) AS open_rate
FROM public.analytics_events
WHERE created_at >= now() - interval '28 days'
  AND event_type IN (
    'feed_loaded',
    'recommendation_fallback',
    'review_impression',
    'review_open',
    'review_read_50',
    'review_read_90',
    'for_you_review_action'
  )
GROUP BY 1
ORDER BY 1 DESC;

-- 2. Recommendation reason funnel.
WITH reason_impressions AS (
  SELECT
    metadata->>'review_id' AS review_id,
    coalesce(metadata->>'reason', 'unknown') AS reason,
    count(*) AS impressions
  FROM public.analytics_events
  WHERE created_at >= now() - interval '28 days'
    AND event_type = 'review_impression'
  GROUP BY 1, 2
),
reason_opens AS (
  SELECT
    metadata->>'review_id' AS review_id,
    count(*) AS opens
  FROM public.analytics_events
  WHERE created_at >= now() - interval '28 days'
    AND event_type = 'review_open'
  GROUP BY 1
),
reason_reads AS (
  SELECT
    metadata->>'review_id' AS review_id,
    count(*) FILTER (WHERE event_type = 'review_read_50') AS read_50,
    count(*) FILTER (WHERE event_type = 'review_read_90') AS read_90
  FROM public.analytics_events
  WHERE created_at >= now() - interval '28 days'
    AND event_type IN ('review_read_50', 'review_read_90')
  GROUP BY 1
),
reason_actions AS (
  SELECT
    metadata->>'review_id' AS review_id,
    count(*) FILTER (WHERE metadata->>'action' = 'like') AS likes,
    count(*) FILTER (WHERE metadata->>'action' = 'bookmark') AS bookmarks,
    count(*) FILTER (WHERE metadata->>'action' IN ('open_comments', 'comment')) AS comment_opens
  FROM public.analytics_events
  WHERE created_at >= now() - interval '28 days'
    AND event_type = 'for_you_review_action'
  GROUP BY 1
)
SELECT
  reason_impressions.reason,
  sum(reason_impressions.impressions) AS impressions,
  coalesce(sum(reason_opens.opens), 0) AS opens,
  coalesce(sum(reason_reads.read_50), 0) AS read_50,
  coalesce(sum(reason_reads.read_90), 0) AS read_90,
  coalesce(sum(reason_actions.likes), 0) AS likes,
  coalesce(sum(reason_actions.bookmarks), 0) AS bookmarks,
  coalesce(sum(reason_actions.comment_opens), 0) AS comment_opens,
  round(
    coalesce(sum(reason_opens.opens), 0)::numeric
    / nullif(sum(reason_impressions.impressions), 0),
    4
  ) AS open_rate,
  round(
    coalesce(sum(reason_reads.read_90), 0)::numeric
    / nullif(sum(reason_impressions.impressions), 0),
    4
  ) AS deep_read_rate,
  round(
    (
      coalesce(sum(reason_actions.likes), 0)
      + coalesce(sum(reason_actions.bookmarks), 0)
      + coalesce(sum(reason_actions.comment_opens), 0)
    )::numeric
    / nullif(sum(reason_impressions.impressions), 0),
    4
  ) AS action_rate
FROM reason_impressions
LEFT JOIN reason_opens
  ON reason_opens.review_id = reason_impressions.review_id
LEFT JOIN reason_reads
  ON reason_reads.review_id = reason_impressions.review_id
LEFT JOIN reason_actions
  ON reason_actions.review_id = reason_impressions.review_id
GROUP BY 1
ORDER BY impressions DESC;

-- 3. Recent review inventory quality.
SELECT
  count(*) AS reviews,
  count(*) FILTER (WHERE nullif(trim(coalesce(body, '')), '') IS NOT NULL) AS written_reviews,
  count(*) FILTER (WHERE nullif(trim(coalesce(body, '')), '') IS NULL) AS rating_only_reviews,
  round(avg(rating)::numeric, 2) AS average_rating,
  count(DISTINCT author_id) AS authors,
  count(DISTINCT entity_id) AS entities,
  sum(greatest(likes_count, 0)) AS likes,
  sum(greatest(comments_count, 0)) AS comments
FROM public.reviews
WHERE created_at >= now() - interval '90 days';

-- 4. Author and entity concentration in recent inventory.
WITH recent_reviews AS (
  SELECT id, author_id, entity_id
  FROM public.reviews
  WHERE created_at >= now() - interval '90 days'
),
author_counts AS (
  SELECT author_id, count(*) AS review_count
  FROM recent_reviews
  GROUP BY 1
),
entity_counts AS (
  SELECT entity_id, count(*) AS review_count
  FROM recent_reviews
  GROUP BY 1
)
SELECT
  'authors' AS dimension,
  count(*) AS distinct_count,
  max(review_count) AS max_reviews_for_one_value,
  round(avg(review_count)::numeric, 2) AS average_reviews_per_value
FROM author_counts
UNION ALL
SELECT
  'entities' AS dimension,
  count(*) AS distinct_count,
  max(review_count) AS max_reviews_for_one_value,
  round(avg(review_count)::numeric, 2) AS average_reviews_per_value
FROM entity_counts;

-- 5. Reviews with strong engagement but low written context.
SELECT
  reviews.id AS review_id,
  reviews.entity_id,
  entities.title,
  entities.artist_name,
  reviews.rating,
  reviews.likes_count,
  reviews.comments_count,
  reviews.created_at,
  CASE
    WHEN nullif(trim(coalesce(reviews.body, '')), '') IS NULL THEN 'rating_only'
    ELSE 'written'
  END AS content_state
FROM public.reviews
JOIN public.entities
  ON entities.id = reviews.entity_id
WHERE reviews.created_at >= now() - interval '180 days'
ORDER BY
  (greatest(reviews.likes_count, 0) + greatest(reviews.comments_count, 0)) DESC,
  reviews.created_at DESC
LIMIT 25;

-- 6. Editorial fallback inventory.
SELECT
  count(*) FILTER (WHERE is_active = true) AS active_starter_tracks,
  count(*) FILTER (WHERE is_active = false) AS inactive_starter_tracks,
  count(*) FILTER (WHERE is_active = true AND nullif(trim(coalesce(editorial_note, '')), '') IS NOT NULL) AS active_with_notes,
  count(*) FILTER (WHERE is_active = true AND nullif(trim(coalesce(editorial_note, '')), '') IS NULL) AS active_without_notes
FROM public.starter_tracks;

-- 7. Persistent candidate queue state.
SELECT
  status,
  count(*) AS candidates,
  min(created_at) AS oldest_created_at,
  max(updated_at) AS newest_updated_at
FROM public.editorial_candidates
GROUP BY 1
ORDER BY candidates DESC, status ASC;
