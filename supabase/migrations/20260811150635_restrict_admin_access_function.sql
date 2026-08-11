-- Admin access checks are internal to authenticated app and RLS flows.

BEGIN;

REVOKE ALL ON FUNCTION public.is_kocteau_admin()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_kocteau_admin()
  TO authenticated;

COMMIT;
