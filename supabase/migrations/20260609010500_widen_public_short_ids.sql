BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT left(replace(id::text, '-', ''), 12) AS short_id, count(*) AS row_count
      FROM public.entities
      GROUP BY left(replace(id::text, '-', ''), 12)
      HAVING count(*) > 1
    ) AS collisions
  ) THEN
    RAISE EXCEPTION 'Cannot widen public.entities.short_id: duplicate 12-character UUID prefixes exist.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT left(replace(id::text, '-', ''), 12) AS short_id, count(*) AS row_count
      FROM public.reviews
      GROUP BY left(replace(id::text, '-', ''), 12)
      HAVING count(*) > 1
    ) AS collisions
  ) THEN
    RAISE EXCEPTION 'Cannot widen public.reviews.short_id: duplicate 12-character UUID prefixes exist.';
  END IF;
END;
$$;

ALTER TABLE public.entities
  DROP CONSTRAINT IF EXISTS entities_short_id_key;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_short_id_key;

ALTER TABLE public.entities
  DROP COLUMN IF EXISTS short_id;

ALTER TABLE public.reviews
  DROP COLUMN IF EXISTS short_id;

ALTER TABLE public.entities
  ADD COLUMN short_id text
  GENERATED ALWAYS AS (left(replace(id::text, '-', ''), 12)) STORED;

ALTER TABLE public.reviews
  ADD COLUMN short_id text
  GENERATED ALWAYS AS (left(replace(id::text, '-', ''), 12)) STORED;

ALTER TABLE public.entities
  ALTER COLUMN short_id SET NOT NULL;

ALTER TABLE public.reviews
  ALTER COLUMN short_id SET NOT NULL;

ALTER TABLE public.entities
  ADD CONSTRAINT entities_short_id_key UNIQUE (short_id);

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_short_id_key UNIQUE (short_id);

COMMIT;
