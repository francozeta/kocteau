-- Kocteau Library later signals RPC hotfix.
-- Run this in the Supabase SQL Editor if `set_entity_library_item`
-- fails with: column reference "entity_id" is ambiguous.
--
-- Root cause: PL/pgSQL output columns from RETURNS TABLE are variables too.
-- The conflict target must use the primary-key constraint name instead of
-- unqualified column names.

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

  IF p_item_type NOT IN ('listen_later', 'review_later') THEN
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
