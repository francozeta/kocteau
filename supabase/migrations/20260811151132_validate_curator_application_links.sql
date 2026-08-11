-- Work samples are rendered as outbound links in Studio.

BEGIN;

ALTER TABLE public.curator_applications
  ADD CONSTRAINT curator_applications_sample_link_protocol_check
  CHECK (
    (sample_links[1] IS NULL OR sample_links[1] ~* '^https?://')
    AND (sample_links[2] IS NULL OR sample_links[2] ~* '^https?://')
    AND (sample_links[3] IS NULL OR sample_links[3] ~* '^https?://')
  );

COMMIT;
