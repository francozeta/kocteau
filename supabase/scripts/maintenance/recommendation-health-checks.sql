-- Kocteau recommendation health checks.
-- Read-only aggregate queries for maintainers.
-- Run in the Supabase SQL editor. Do not expose raw rows publicly.

-- 1. Daily For You feed load and fallback health.
SELECT
  date_trunc('day', created_at) AS day,
  count(*) FILTER (WHERE event_type = 'feed_loaded') AS feed_loads,
  count(*) FILTER (WHERE event_type = 'recommendation_fallback') AS fallbacks,
  round(
    count(*) FILTER (WHERE event_type = 'recommendation_fallback')::numeric
    / nullif(count(*) FILTER (WHERE event_type = 'feed_loaded'), 0),
    4
  ) AS fallback_rate
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type IN ('feed_loaded', 'recommendation_fallback')
GROUP BY 1
ORDER BY 1 DESC;

-- 2. Surfaced recommendation reasons.
SELECT
  coalesce(metadata->>'reason', 'unknown') AS reason,
  count(*) AS impressions,
  min(created_at) AS first_seen_at,
  max(created_at) AS last_seen_at
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type = 'review_impression'
GROUP BY 1
ORDER BY impressions DESC;

-- 3. Review open rate by recommendation reason.
WITH impressions AS (
  SELECT
    metadata->>'review_id' AS review_id,
    coalesce(metadata->>'reason', 'unknown') AS reason,
    count(*) AS impression_count
  FROM public.analytics_events
  WHERE created_at >= now() - interval '14 days'
    AND event_type = 'review_impression'
  GROUP BY 1, 2
),
opens AS (
  SELECT
    metadata->>'review_id' AS review_id,
    count(*) AS open_count
  FROM public.analytics_events
  WHERE created_at >= now() - interval '14 days'
    AND event_type = 'review_open'
  GROUP BY 1
)
SELECT
  impressions.reason,
  sum(impressions.impression_count) AS impressions,
  coalesce(sum(opens.open_count), 0) AS opens,
  round(
    coalesce(sum(opens.open_count), 0)::numeric
    / nullif(sum(impressions.impression_count), 0),
    4
  ) AS open_rate
FROM impressions
LEFT JOIN opens ON opens.review_id = impressions.review_id
GROUP BY 1
ORDER BY impressions DESC;

-- 4. Starter pick funnel.
SELECT
  date_trunc('day', created_at) AS day,
  count(*) FILTER (WHERE event_type = 'starter_impression') AS impressions,
  count(*) FILTER (WHERE event_type = 'starter_pass') AS passes,
  count(*) FILTER (WHERE event_type = 'starter_review_cta') AS review_ctas,
  count(*) FILTER (WHERE event_type = 'starter_review_published') AS reviews_published,
  round(
    count(*) FILTER (WHERE event_type = 'starter_review_published')::numeric
    / nullif(count(*) FILTER (WHERE event_type = 'starter_impression'), 0),
    4
  ) AS review_conversion_rate
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type IN (
    'starter_impression',
    'starter_pass',
    'starter_review_cta',
    'starter_review_published'
  )
GROUP BY 1
ORDER BY 1 DESC;

-- 5. Starter pick quality by track.
SELECT
  metadata->>'starter_track_id' AS starter_track_id,
  max(metadata->>'provider_id') AS provider_id,
  count(*) FILTER (WHERE event_type = 'starter_impression') AS impressions,
  count(*) FILTER (WHERE event_type = 'starter_pass') AS passes,
  count(*) FILTER (WHERE event_type = 'starter_review_cta') AS review_ctas,
  count(*) FILTER (WHERE event_type = 'starter_review_published') AS reviews_published
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type LIKE 'starter_%'
GROUP BY 1
ORDER BY impressions DESC NULLS LAST;

-- 6. Entity destination health.
SELECT
  metadata->>'entity_id' AS entity_id,
  max(metadata->>'provider') AS provider,
  max(metadata->>'provider_id') AS provider_id,
  max(metadata->>'type') AS type,
  count(*) AS opens
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type = 'entity_open'
GROUP BY 1
ORDER BY opens DESC;

-- 7. Starter tag coverage by tag kind.
SELECT
  preference_tags.kind,
  count(DISTINCT starter_track_tags.starter_track_id) AS tagged_tracks,
  count(DISTINCT starter_track_tags.tag_id) AS tag_count
FROM public.starter_track_tags
JOIN public.preference_tags
  ON preference_tags.id = starter_track_tags.tag_id
JOIN public.starter_tracks
  ON starter_tracks.id = starter_track_tags.starter_track_id
WHERE starter_tracks.is_active = true
GROUP BY 1
ORDER BY tagged_tracks DESC, preference_tags.kind ASC;
