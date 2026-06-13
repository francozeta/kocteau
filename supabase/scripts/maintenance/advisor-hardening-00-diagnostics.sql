-- Kocteau Supabase advisor hardening diagnostics.
-- Run this first in the Supabase SQL Editor.
--
-- This script is read-only. It shows the current EXECUTE surface for the
-- SECURITY DEFINER functions reported by Supabase Advisors, the search_path
-- state for trigger helpers, and avatar storage policies.

WITH target_functions(name) AS (
  VALUES
    ('archive_starter_track'),
    ('broadcast_notification_event'),
    ('check_rate_limit'),
    ('create_notification'),
    ('create_review_with_entity'),
    ('get_recommendation_health_snapshot'),
    ('get_recommended_review_ids'),
    ('get_starter_tracks'),
    ('get_starter_tracks_for_surface'),
    ('get_viewer_entity_library_state'),
    ('get_viewer_review_collection_state'),
    ('handle_new_user'),
    ('handle_review_comment_notification'),
    ('handle_review_like_notification'),
    ('handle_review_like_notification_delete'),
    ('infer_entity_preference_tags_from_user'),
    ('is_starter_curator'),
    ('reconcile_review_comments_count'),
    ('rls_auto_enable'),
    ('set_entity_library_item'),
    ('sync_entity_tags_from_starter_track'),
    ('toggle_profile_follow'),
    ('toggle_review_bookmark'),
    ('toggle_review_like'),
    ('unlock_first_review_creator_perk'),
    ('update_editorial_candidate_status'),
    ('update_preference_tag'),
    ('upsert_editorial_candidate'),
    ('upsert_preference_tag'),
    ('upsert_starter_track')
)
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  coalesce(
    array_to_string(p.proconfig, ', '),
    '(role mutable)'
  ) AS function_config,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  EXISTS (
    SELECT 1
    FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    WHERE acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) AS public_can_execute
FROM pg_proc p
JOIN pg_namespace n
  ON n.oid = p.pronamespace
JOIN target_functions target
  ON target.name = p.proname
WHERE n.nspname = 'public'
ORDER BY
  anon_can_execute DESC,
  authenticated_can_execute DESC,
  p.proname,
  arguments;

WITH helper_functions(name) AS (
  VALUES
    ('handle_review_comments_updated_at'),
    ('handle_review_comments_count'),
    ('set_updated_at')
)
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  coalesce(
    array_to_string(p.proconfig, ', '),
    '(role mutable)'
  ) AS function_config
FROM pg_proc p
JOIN pg_namespace n
  ON n.oid = p.pronamespace
JOIN helper_functions target
  ON target.name = p.proname
WHERE n.nspname = 'public'
ORDER BY p.proname, arguments;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%avatar%'
    OR qual ILIKE '%avatars%'
    OR with_check ILIKE '%avatars%'
  )
ORDER BY policyname;
