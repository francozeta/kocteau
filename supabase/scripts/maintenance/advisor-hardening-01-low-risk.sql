-- Kocteau Supabase advisor hardening stage 1.
-- Run this in the Supabase SQL Editor after reviewing
-- advisor-hardening-00-diagnostics.sql.
--
-- Scope:
-- 1. Fix mutable search_path warnings for trigger/helper functions.
-- 2. Remove broad public listing access from the public avatars bucket.
--
-- This should not delete data. Public avatar URLs still work when the bucket
-- itself is public; the removed policy only prevents broad object listing via
-- the Storage API.

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
        'handle_review_comments_updated_at',
        'handle_review_comments_count',
        'set_updated_at'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public',
      fn.schema_name,
      fn.function_name,
      fn.arguments
    );

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

DROP POLICY IF EXISTS avatars_public_read
  ON storage.objects;

DROP POLICY IF EXISTS "Avatar objects are public"
  ON storage.objects;

COMMIT;

-- Recommended follow-up:
-- 1. Run advisor-hardening-00-diagnostics.sql again.
-- 2. Confirm the avatar upload/update/delete policies still exist.
-- 3. Confirm a known public avatar_url still loads in the browser.
