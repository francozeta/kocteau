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

DO $$
DECLARE
  current_expression text;
BEGIN
  SELECT generation_expression
  INTO current_expression
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'entities'
    AND column_name = 'short_id';

  IF current_expression IS NULL OR current_expression NOT ILIKE '%12%' THEN
    ALTER TABLE public.entities
      DROP CONSTRAINT IF EXISTS entities_short_id_key;

    ALTER TABLE public.entities
      DROP COLUMN IF EXISTS short_id;

    ALTER TABLE public.entities
      ADD COLUMN short_id text
      GENERATED ALWAYS AS (left(replace(id::text, '-', ''), 12)) STORED;
  END IF;
END;
$$;

DO $$
DECLARE
  current_expression text;
BEGIN
  SELECT generation_expression
  INTO current_expression
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'reviews'
    AND column_name = 'short_id';

  IF current_expression IS NULL OR current_expression NOT ILIKE '%12%' THEN
    ALTER TABLE public.reviews
      DROP CONSTRAINT IF EXISTS reviews_short_id_key;

    ALTER TABLE public.reviews
      DROP COLUMN IF EXISTS short_id;

    ALTER TABLE public.reviews
      ADD COLUMN short_id text
      GENERATED ALWAYS AS (left(replace(id::text, '-', ''), 12)) STORED;
  END IF;
END;
$$;

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
