BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT left(id::text, 8) AS short_id, count(*) AS row_count
      FROM public.entities
      GROUP BY left(id::text, 8)
      HAVING count(*) > 1
    ) AS collisions
  ) THEN
    RAISE EXCEPTION 'Cannot add public.entities.short_id: duplicate 8-character UUID prefixes exist.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT left(id::text, 8) AS short_id, count(*) AS row_count
      FROM public.reviews
      GROUP BY left(id::text, 8)
      HAVING count(*) > 1
    ) AS collisions
  ) THEN
    RAISE EXCEPTION 'Cannot add public.reviews.short_id: duplicate 8-character UUID prefixes exist.';
  END IF;
END;
$$;

ALTER TABLE public.entities
  ADD COLUMN IF NOT EXISTS short_id text
  GENERATED ALWAYS AS (left(id::text, 8)) STORED;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS short_id text
  GENERATED ALWAYS AS (left(id::text, 8)) STORED;

ALTER TABLE public.entities
  ALTER COLUMN short_id SET NOT NULL;

ALTER TABLE public.reviews
  ALTER COLUMN short_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.entities'::regclass
      AND conname = 'entities_short_id_key'
  ) THEN
    ALTER TABLE public.entities
      ADD CONSTRAINT entities_short_id_key UNIQUE (short_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.reviews'::regclass
      AND conname = 'reviews_short_id_key'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_short_id_key UNIQUE (short_id);
  END IF;
END;
$$;

COMMIT;
