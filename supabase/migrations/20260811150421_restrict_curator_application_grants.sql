-- Keep curator applications readable and insertable only through the intended flows.

BEGIN;

REVOKE ALL ON TABLE public.curator_applications
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT ON TABLE public.curator_applications
  TO authenticated;

COMMIT;
