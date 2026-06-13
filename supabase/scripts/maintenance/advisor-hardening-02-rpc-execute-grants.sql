-- Kocteau Supabase advisor hardening stage 2.
-- Run this in the Supabase SQL Editor after stage 1 and after confirming
-- normal auth/review/starter flows still work.
--
-- Scope:
-- 1. Revoke PUBLIC/anon/authenticated EXECUTE from advisor-reported
--    SECURITY DEFINER functions.
-- 2. Grant authenticated EXECUTE back only to RPCs that Kocteau calls from
--    authenticated server routes or guarded Studio flows.
--
-- This intentionally does NOT grant anon EXECUTE to any SECURITY DEFINER RPC.
-- Public starter picks use table reads, not the personalized starter RPC.

BEGIN;

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'archive_starter_track',
        'broadcast_notification_event',
        'check_rate_limit',
        'create_notification',
        'create_review_with_entity',
        'get_recommendation_health_snapshot',
        'get_recommended_review_ids',
        'get_starter_tracks',
        'get_starter_tracks_for_surface',
        'get_viewer_entity_library_state',
        'get_viewer_review_collection_state',
        'handle_new_user',
        'handle_review_comment_notification',
        'handle_review_like_notification',
        'handle_review_like_notification_delete',
        'infer_entity_preference_tags_from_user',
        'is_starter_curator',
        'reconcile_review_comments_count',
        'rls_auto_enable',
        'set_entity_library_item',
        'sync_entity_tags_from_starter_track',
        'toggle_profile_follow',
        'toggle_review_bookmark',
        'toggle_review_like',
        'unlock_first_review_creator_perk',
        'update_editorial_candidate_status',
        'update_preference_tag',
        'upsert_editorial_candidate',
        'upsert_preference_tag',
        'upsert_starter_track'
      )
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC',
      fn.schema_name,
      fn.function_name,
      fn.arguments
    );

    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon',
      fn.schema_name,
      fn.function_name,
      fn.arguments
    );

    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM authenticated',
      fn.schema_name,
      fn.function_name,
      fn.arguments
    );
  END LOOP;
END;
$$;

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        -- Core authenticated product actions.
        'check_rate_limit',
        'create_review_with_entity',
        'get_recommended_review_ids',
        'get_viewer_entity_library_state',
        'get_viewer_review_collection_state',
        'infer_entity_preference_tags_from_user',
        'reconcile_review_comments_count',
        'set_entity_library_item',
        'sync_entity_tags_from_starter_track',
        'toggle_profile_follow',
        'toggle_review_bookmark',
        'toggle_review_like',

        -- Authenticated starter/studio reads and curator-gated writes.
        'archive_starter_track',
        'get_recommendation_health_snapshot',
        'get_starter_tracks',
        'get_starter_tracks_for_surface',
        'is_starter_curator',
        'update_editorial_candidate_status',
        'update_preference_tag',
        'upsert_editorial_candidate',
        'upsert_preference_tag',
        'upsert_starter_track'
      )
  LOOP
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated',
      fn.schema_name,
      fn.function_name,
      fn.arguments
    );
  END LOOP;
END;
$$;

COMMIT;

-- RPCs intentionally left without client grants:
-- - broadcast_notification_event()
-- - create_notification(...)
-- - handle_new_user()
-- - handle_review_comment_notification()
-- - handle_review_like_notification()
-- - handle_review_like_notification_delete()
-- - rls_auto_enable()
-- - unlock_first_review_creator_perk()
--
-- Recommended follow-up:
-- 1. Run advisor-hardening-00-diagnostics.sql again.
-- 2. Run Supabase Advisors again.
-- 3. Smoke test: login, create review, like, bookmark, comment,
--    follow, add to library, starter studio, recommendation health.
