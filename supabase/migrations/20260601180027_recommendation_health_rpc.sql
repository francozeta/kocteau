-- Kocteau recommendation health aggregate RPC.
-- Apply after analytics signal contract events are deployed.
-- This function intentionally returns grouped health metrics only.

BEGIN;

DROP FUNCTION IF EXISTS public.get_recommendation_health_snapshot(integer);

CREATE OR REPLACE FUNCTION public.get_recommendation_health_snapshot(
  p_days integer DEFAULT 14
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_days integer := greatest(1, least(coalesce(p_days, 14), 90));
  v_start_at timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 14), 90)));
  v_end_at timestamptz := now();
BEGIN
  IF NOT public.is_starter_curator() THEN
    RAISE EXCEPTION 'not allowed'
      USING ERRCODE = '42501';
  END IF;

  RETURN (
    WITH events AS (
      SELECT
        event_type,
        source,
        metadata,
        created_at
      FROM public.analytics_events
      WHERE created_at >= v_start_at
        AND created_at <= v_end_at
    ),
    feed_counts AS (
      SELECT
        count(*) FILTER (WHERE event_type = 'feed_loaded') AS loads,
        count(*) FILTER (WHERE event_type = 'recommendation_fallback') AS fallbacks,
        count(*) FILTER (WHERE event_type = 'review_impression') AS review_impressions,
        count(*) FILTER (WHERE event_type = 'review_open') AS review_opens,
        count(*) FILTER (WHERE event_type = 'entity_open') AS entity_opens
      FROM events
    ),
    feed_daily AS (
      SELECT
        date_trunc('day', created_at)::date AS day,
        count(*) FILTER (WHERE event_type = 'feed_loaded') AS loads,
        count(*) FILTER (WHERE event_type = 'recommendation_fallback') AS fallbacks,
        count(*) FILTER (WHERE event_type = 'review_impression') AS review_impressions,
        count(*) FILTER (WHERE event_type = 'review_open') AS review_opens
      FROM events
      WHERE event_type IN (
        'feed_loaded',
        'recommendation_fallback',
        'review_impression',
        'review_open'
      )
      GROUP BY 1
    ),
    reason_impressions AS (
      SELECT
        metadata->>'review_id' AS review_id,
        coalesce(metadata->>'reason', 'unknown') AS reason,
        count(*) AS impressions
      FROM events
      WHERE event_type = 'review_impression'
      GROUP BY 1, 2
    ),
    review_opens AS (
      SELECT
        metadata->>'review_id' AS review_id,
        count(*) AS opens
      FROM events
      WHERE event_type = 'review_open'
      GROUP BY 1
    ),
    reason_health AS (
      SELECT
        reason_impressions.reason,
        sum(reason_impressions.impressions) AS impressions,
        coalesce(sum(review_opens.opens), 0) AS opens
      FROM reason_impressions
      LEFT JOIN review_opens
        ON review_opens.review_id = reason_impressions.review_id
      GROUP BY 1
    ),
    starter_counts AS (
      SELECT
        count(*) FILTER (WHERE event_type = 'starter_impression') AS impressions,
        count(*) FILTER (WHERE event_type = 'starter_pass') AS passes,
        count(*) FILTER (WHERE event_type = 'starter_review_cta') AS review_ctas,
        count(*) FILTER (WHERE event_type = 'starter_review_published') AS reviews_published
      FROM events
      WHERE event_type IN (
        'starter_impression',
        'starter_pass',
        'starter_review_cta',
        'starter_review_published'
      )
    ),
    starter_track_health AS (
      SELECT
        metadata->>'starter_track_id' AS starter_track_id,
        max(metadata->>'provider_id') AS provider_id,
        count(*) FILTER (WHERE event_type = 'starter_impression') AS impressions,
        count(*) FILTER (WHERE event_type = 'starter_pass') AS passes,
        count(*) FILTER (WHERE event_type = 'starter_review_cta') AS review_ctas,
        count(*) FILTER (WHERE event_type = 'starter_review_published') AS reviews_published
      FROM events
      WHERE event_type LIKE 'starter_%'
        AND metadata ? 'starter_track_id'
      GROUP BY 1
    ),
    entity_health AS (
      SELECT
        metadata->>'entity_id' AS entity_id,
        max(metadata->>'provider') AS provider,
        max(metadata->>'provider_id') AS provider_id,
        max(metadata->>'type') AS type,
        count(*) AS opens
      FROM events
      WHERE event_type = 'entity_open'
        AND metadata ? 'entity_id'
      GROUP BY 1
    ),
    tag_coverage AS (
      SELECT
        preference_tags.kind::text AS kind,
        count(DISTINCT starter_track_tags.starter_track_id) AS tagged_tracks,
        count(DISTINCT starter_track_tags.tag_id) AS tag_count
      FROM public.starter_track_tags AS starter_track_tags
      JOIN public.preference_tags AS preference_tags
        ON preference_tags.id = starter_track_tags.tag_id
      JOIN public.starter_tracks AS starter_tracks
        ON starter_tracks.id = starter_track_tags.starter_track_id
      WHERE starter_tracks.is_active = true
      GROUP BY 1
    )
    SELECT jsonb_build_object(
      'window', jsonb_build_object(
        'days', v_days,
        'startAt', v_start_at,
        'endAt', v_end_at
      ),
      'feed', (
        SELECT jsonb_build_object(
          'loads', loads,
          'fallbacks', fallbacks,
          'fallbackRate', coalesce(round(fallbacks::numeric / nullif(loads, 0), 4), 0),
          'reviewImpressions', review_impressions,
          'reviewOpens', review_opens,
          'reviewOpenRate', coalesce(round(review_opens::numeric / nullif(review_impressions, 0), 4), 0),
          'entityOpens', entity_opens
        )
        FROM feed_counts
      ),
      'feedDaily', coalesce((
        SELECT jsonb_agg(
          jsonb_build_object(
            'day', day,
            'loads', loads,
            'fallbacks', fallbacks,
            'fallbackRate', coalesce(round(fallbacks::numeric / nullif(loads, 0), 4), 0),
            'reviewImpressions', review_impressions,
            'reviewOpens', review_opens,
            'reviewOpenRate', coalesce(round(review_opens::numeric / nullif(review_impressions, 0), 4), 0)
          )
          ORDER BY day DESC
        )
        FROM feed_daily
      ), '[]'::jsonb),
      'reasons', coalesce((
        SELECT jsonb_agg(
          jsonb_build_object(
            'reason', reason,
            'impressions', impressions,
            'opens', opens,
            'openRate', coalesce(round(opens::numeric / nullif(impressions, 0), 4), 0)
          )
          ORDER BY impressions DESC, reason ASC
        )
        FROM reason_health
      ), '[]'::jsonb),
      'starter', (
        SELECT jsonb_build_object(
          'impressions', impressions,
          'passes', passes,
          'passRate', coalesce(round(passes::numeric / nullif(impressions, 0), 4), 0),
          'reviewCtas', review_ctas,
          'reviewsPublished', reviews_published,
          'reviewConversionRate', coalesce(round(reviews_published::numeric / nullif(impressions, 0), 4), 0)
        )
        FROM starter_counts
      ),
      'starterTracks', coalesce((
        SELECT jsonb_agg(
          jsonb_build_object(
            'starterTrackId', starter_track_health.starter_track_id,
            'providerId', starter_track_health.provider_id,
            'title', starter_tracks.title,
            'artistName', starter_tracks.artist_name,
            'impressions', starter_track_health.impressions,
            'passes', starter_track_health.passes,
            'passRate', coalesce(round(starter_track_health.passes::numeric / nullif(starter_track_health.impressions, 0), 4), 0),
            'reviewCtas', starter_track_health.review_ctas,
            'reviewsPublished', starter_track_health.reviews_published,
            'reviewConversionRate', coalesce(round(starter_track_health.reviews_published::numeric / nullif(starter_track_health.impressions, 0), 4), 0)
          )
          ORDER BY starter_track_health.impressions DESC, starter_track_health.passes DESC
        )
        FROM starter_track_health
        LEFT JOIN public.starter_tracks AS starter_tracks
          ON starter_tracks.id::text = starter_track_health.starter_track_id
      ), '[]'::jsonb),
      'tagCoverage', coalesce((
        SELECT jsonb_agg(
          jsonb_build_object(
            'kind', kind,
            'taggedTracks', tagged_tracks,
            'tagCount', tag_count
          )
          ORDER BY tagged_tracks DESC, kind ASC
        )
        FROM tag_coverage
      ), '[]'::jsonb),
      'entities', coalesce((
        SELECT jsonb_agg(
          jsonb_build_object(
            'entityId', entity_health.entity_id,
            'provider', coalesce(entities.provider, entity_health.provider),
            'providerId', coalesce(entities.provider_id, entity_health.provider_id),
            'type', coalesce(entities.type::text, entity_health.type),
            'title', entities.title,
            'artistName', entities.artist_name,
            'opens', entity_health.opens
          )
          ORDER BY entity_health.opens DESC
        )
        FROM entity_health
        LEFT JOIN public.entities AS entities
          ON entities.id::text = entity_health.entity_id
      ), '[]'::jsonb)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_recommendation_health_snapshot(integer)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_recommendation_health_snapshot(integer)
  TO authenticated;

COMMIT;
