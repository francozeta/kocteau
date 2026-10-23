BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

-- Qualify the outer ID: an unqualified review_id inside either subquery
-- resolves to the inner table and marks every card when any interaction exists.
CREATE OR REPLACE FUNCTION public.get_viewer_review_collection_state(
  p_review_ids uuid[]
)
RETURNS TABLE (review_id uuid, liked boolean, bookmarked boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT requested.review_id,
    EXISTS (
      SELECT 1 FROM public.review_likes AS liked_review
      WHERE liked_review.review_id = requested.review_id
        AND liked_review.user_id = (SELECT auth.uid())
    ) AS liked,
    EXISTS (
      SELECT 1 FROM public.review_bookmarks AS saved_review
      WHERE saved_review.review_id = requested.review_id
        AND saved_review.user_id = (SELECT auth.uid())
    ) AS bookmarked
  FROM unnest(coalesce(p_review_ids, ARRAY[]::uuid[])) AS requested(review_id);
$$;

COMMIT;
