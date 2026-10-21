BEGIN;

ALTER TABLE public.editorial_proposals
  DROP CONSTRAINT editorial_proposals_error_code_check,
  ADD CONSTRAINT editorial_proposals_error_code_check CHECK (error_code IN (
    'unavailable', 'invalid_output', 'interrupted',
    'provider_rate_limit', 'provider_quota', 'model_auth'
  ));

COMMIT;
