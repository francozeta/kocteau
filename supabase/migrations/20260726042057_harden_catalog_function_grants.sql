REVOKE ALL ON FUNCTION public.claim_catalog_enrichment_job()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_catalog_enrichment_job()
  TO service_role;

REVOKE ALL ON FUNCTION public.create_review_with_entity(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_review_with_entity(
  text,
  text,
  public.entity_type,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  text
) TO authenticated;
