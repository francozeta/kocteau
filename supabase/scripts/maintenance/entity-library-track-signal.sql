-- Kocteau Library unified track signal.
-- Run this in the Supabase SQL Editor before testing Add to library
-- against Supabase Cloud.
--
-- This mirrors supabase/migrations/20260610120000_entity_library_items.sql.
-- It also migrates any earlier listen_later/review_later rows into library.

BEGIN;

CREATE TABLE IF NOT EXISTS public.entity_library_items (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entity_library_items_pkey PRIMARY KEY (user_id, entity_id, item_type),
  CONSTRAINT entity_library_items_item_type_check
    CHECK (item_type = 'library'),
  CONSTRAINT entity_library_items_source_check
    CHECK (source ~ '^[a-z0-9_:-]{2,80}$')
);

ALTER TABLE public.entity_library_items
  DROP CONSTRAINT IF EXISTS entity_library_items_item_type_check;

WITH legacy_items AS (
  SELECT
    user_id,
    entity_id,
    'library'::text AS item_type,
    'migration:library_unified'::text AS source,
    min(created_at) AS created_at,
    max(updated_at) AS updated_at
  FROM public.entity_library_items
  WHERE item_type IN ('listen_later', 'review_later')
  GROUP BY user_id, entity_id
)
INSERT INTO public.entity_library_items (
  user_id,
  entity_id,
  item_type,
  source,
  created_at,
  updated_at
)
SELECT
  user_id,
  entity_id,
  item_type,
  source,
  created_at,
  updated_at
FROM legacy_items
ON CONFLICT ON CONSTRAINT entity_library_items_pkey
DO UPDATE SET
  updated_at = greatest(public.entity_library_items.updated_at, EXCLUDED.updated_at);

DELETE FROM public.entity_library_items
WHERE item_type IN ('listen_later', 'review_later');

ALTER TABLE public.entity_library_items
  ADD CONSTRAINT entity_library_items_item_type_check
  CHECK (item_type = 'library');

CREATE INDEX IF NOT EXISTS entity_library_items_user_type_created_idx
  ON public.entity_library_items (user_id, item_type, created_at DESC);

CREATE INDEX IF NOT EXISTS entity_library_items_entity_type_idx
  ON public.entity_library_items (entity_id, item_type);

DROP TRIGGER IF EXISTS set_entity_library_items_updated_at
  ON public.entity_library_items;

CREATE TRIGGER set_entity_library_items_updated_at
  BEFORE UPDATE ON public.entity_library_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.entity_library_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their entity library items"
  ON public.entity_library_items;
DROP POLICY IF EXISTS "Users can insert their entity library items"
  ON public.entity_library_items;
DROP POLICY IF EXISTS "Users can update their entity library items"
  ON public.entity_library_items;
DROP POLICY IF EXISTS "Users can delete their entity library items"
  ON public.entity_library_items;

CREATE POLICY "Users can read their entity library items"
  ON public.entity_library_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their entity library items"
  ON public.entity_library_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their entity library items"
  ON public.entity_library_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their entity library items"
  ON public.entity_library_items
  FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_library_items TO authenticated;

CREATE OR REPLACE FUNCTION public.set_entity_library_item(
  p_entity_id uuid,
  p_item_type text,
  p_active boolean,
  p_source text DEFAULT 'manual'
)
RETURNS TABLE (
  entity_id uuid,
  item_type text,
  active boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_created_at timestamp with time zone;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '42501';
  END IF;

  IF p_item_type <> 'library' THEN
    RAISE EXCEPTION 'Unsupported library item type'
      USING ERRCODE = '22023';
  END IF;

  IF p_source IS NULL OR p_source !~ '^[a-z0-9_:-]{2,80}$' THEN
    RAISE EXCEPTION 'Invalid library item source'
      USING ERRCODE = '22023';
  END IF;

  IF p_active THEN
    INSERT INTO public.entity_library_items (
      user_id,
      entity_id,
      item_type,
      source
    )
    VALUES (
      v_user_id,
      p_entity_id,
      p_item_type,
      p_source
    )
    ON CONFLICT ON CONSTRAINT entity_library_items_pkey
    DO UPDATE SET
      source = EXCLUDED.source,
      updated_at = now()
    RETURNING entity_library_items.created_at
    INTO v_created_at;

    RETURN QUERY SELECT p_entity_id, p_item_type, true, v_created_at;
    RETURN;
  END IF;

  DELETE FROM public.entity_library_items item
  WHERE item.user_id = v_user_id
    AND item.entity_id = p_entity_id
    AND item.item_type = p_item_type
  RETURNING item.created_at INTO v_created_at;

  RETURN QUERY SELECT p_entity_id, p_item_type, false, v_created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.set_entity_library_item(uuid, text, boolean, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_entity_library_item(uuid, text, boolean, text)
  TO authenticated;

DROP FUNCTION IF EXISTS public.get_viewer_entity_library_state(uuid[]);

CREATE OR REPLACE FUNCTION public.get_viewer_entity_library_state(
  p_entity_ids uuid[]
)
RETURNS TABLE (
  entity_id uuid,
  library boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH requested AS (
    SELECT DISTINCT unnest(coalesce(p_entity_ids, ARRAY[]::uuid[])) AS entity_id
  )
  SELECT
    requested.entity_id,
    EXISTS (
      SELECT 1
      FROM public.entity_library_items item
      WHERE item.user_id = auth.uid()
        AND item.entity_id = requested.entity_id
        AND item.item_type = 'library'
    ) AS library
  FROM requested;
$$;

REVOKE ALL ON FUNCTION public.get_viewer_entity_library_state(uuid[])
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_viewer_entity_library_state(uuid[])
  TO authenticated;

COMMIT;
