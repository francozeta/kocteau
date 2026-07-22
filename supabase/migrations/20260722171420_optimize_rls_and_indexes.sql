BEGIN;

-- Keep one policy per operation. The production schema accumulated equivalent
-- policies from earlier migrations and dashboard repairs; permissive policies
-- are OR-ed together and every matching policy is evaluated for each query.

DROP POLICY IF EXISTS "Profiles are readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
DROP POLICY IF EXISTS profiles_read_public ON public.profiles;
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

CREATE POLICY "Profiles are readable"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Entities are readable" ON public.entities;
DROP POLICY IF EXISTS "Authenticated users can create Deezer entities" ON public.entities;
DROP POLICY IF EXISTS entities_public_read ON public.entities;
DROP POLICY IF EXISTS entities_read_public ON public.entities;
DROP POLICY IF EXISTS entities_insert_auth ON public.entities;
DROP POLICY IF EXISTS entities_update_auth ON public.entities;

CREATE POLICY entities_public_read
  ON public.entities
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY entities_insert_auth
  ON public.entities
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY entities_update_auth
  ON public.entities
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Reviews are readable" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their reviews" ON public.reviews;
DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
DROP POLICY IF EXISTS reviews_read_public ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_self ON public.reviews;
DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
DROP POLICY IF EXISTS reviews_update_self ON public.reviews;
DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;
DROP POLICY IF EXISTS reviews_delete_self ON public.reviews;

CREATE POLICY reviews_public_read
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY reviews_insert_own
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY reviews_update_own
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY reviews_delete_own
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can read relevant review likes" ON public.review_likes;
DROP POLICY IF EXISTS "Users can insert their review likes" ON public.review_likes;
DROP POLICY IF EXISTS "Users and review authors can delete review likes" ON public.review_likes;
DROP POLICY IF EXISTS review_likes_read_public ON public.review_likes;
DROP POLICY IF EXISTS review_likes_select_own ON public.review_likes;
DROP POLICY IF EXISTS review_likes_insert_own ON public.review_likes;
DROP POLICY IF EXISTS review_likes_insert_self ON public.review_likes;
DROP POLICY IF EXISTS review_likes_delete_own ON public.review_likes;
DROP POLICY IF EXISTS review_likes_delete_self ON public.review_likes;

CREATE POLICY review_likes_read_public
  ON public.review_likes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY review_likes_insert_own
  ON public.review_likes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY review_likes_delete_own
  ON public.review_likes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their entity bookmarks" ON public.entity_bookmarks;
DROP POLICY IF EXISTS entity_bookmarks_read_public ON public.entity_bookmarks;
DROP POLICY IF EXISTS entity_bookmarks_select_own ON public.entity_bookmarks;
DROP POLICY IF EXISTS entity_bookmarks_insert_own ON public.entity_bookmarks;
DROP POLICY IF EXISTS entity_bookmarks_insert_self ON public.entity_bookmarks;
DROP POLICY IF EXISTS entity_bookmarks_delete_own ON public.entity_bookmarks;
DROP POLICY IF EXISTS entity_bookmarks_delete_self ON public.entity_bookmarks;

CREATE POLICY entity_bookmarks_read_public
  ON public.entity_bookmarks
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY entity_bookmarks_insert_own
  ON public.entity_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY entity_bookmarks_delete_own
  ON public.entity_bookmarks
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Review comments are readable" ON public.review_comments;
DROP POLICY IF EXISTS "Users can insert their comments" ON public.review_comments;
DROP POLICY IF EXISTS "Users can update their comments" ON public.review_comments;
DROP POLICY IF EXISTS "Users and review authors can delete comments" ON public.review_comments;
DROP POLICY IF EXISTS review_comments_select_public ON public.review_comments;
DROP POLICY IF EXISTS review_comments_insert_own ON public.review_comments;
DROP POLICY IF EXISTS review_comments_delete_own ON public.review_comments;

CREATE POLICY review_comments_select_public
  ON public.review_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY review_comments_insert_own
  ON public.review_comments
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY review_comments_delete_own
  ON public.review_comments
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can read their review bookmarks" ON public.review_bookmarks;
DROP POLICY IF EXISTS "Users can insert their review bookmarks" ON public.review_bookmarks;
DROP POLICY IF EXISTS "Users and review authors can delete review bookmarks" ON public.review_bookmarks;
DROP POLICY IF EXISTS review_bookmarks_select_own ON public.review_bookmarks;
DROP POLICY IF EXISTS review_bookmarks_insert_own ON public.review_bookmarks;
DROP POLICY IF EXISTS review_bookmarks_delete_own ON public.review_bookmarks;

CREATE POLICY review_bookmarks_select_own
  ON public.review_bookmarks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY review_bookmarks_insert_own
  ON public.review_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY review_bookmarks_delete_own
  ON public.review_bookmarks
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Review authors can delete review notifications" ON public.notifications;
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;

CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = recipient_id);

CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = recipient_id)
  WITH CHECK ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Users can read their entity library items" ON public.entity_library_items;
DROP POLICY IF EXISTS "Users can insert their entity library items" ON public.entity_library_items;
DROP POLICY IF EXISTS "Users can update their entity library items" ON public.entity_library_items;
DROP POLICY IF EXISTS "Users can delete their entity library items" ON public.entity_library_items;

CREATE POLICY "Users can read their entity library items"
  ON public.entity_library_items
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their entity library items"
  ON public.entity_library_items
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their entity library items"
  ON public.entity_library_items
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their entity library items"
  ON public.entity_library_items
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own analytics events" ON public.analytics_events;

CREATE POLICY "Users can insert their own analytics events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- The notification broadcast policy predates the local migration history in
-- some environments. Update it only where the matching channel helper exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'realtime'
      AND tablename = 'messages'
      AND policyname = 'notifications_receive_own_broadcasts'
  )
  AND to_regprocedure('public.notification_channel_topic(uuid)') IS NOT NULL
  THEN
    EXECUTE $policy$
      ALTER POLICY notifications_receive_own_broadcasts
        ON realtime.messages
        TO authenticated
        USING (
          extension = 'broadcast'
          AND realtime.topic() = public.notification_channel_topic((SELECT auth.uid()))
        )
    $policy$;
  END IF;
END;
$$;

-- Retain the review indexes with real production scans and remove only their
-- byte-for-byte duplicates.
DROP INDEX IF EXISTS public.reviews_author_created_at_id_idx;
DROP INDEX IF EXISTS public.reviews_created_at_id_idx;
DROP INDEX IF EXISTS public.reviews_entity_created_at_id_idx;
DROP INDEX IF EXISTS public.reviews_rating_created_idx;

-- Foreign-key columns are not indexed automatically. These protect joins and
-- parent deletes as the corresponding tables grow.
DO $$
BEGIN
  IF to_regclass('private.otp_challenges') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS otp_challenges_user_id_idx ON private.otp_challenges (user_id)';
  END IF;
END;
$$;
CREATE INDEX IF NOT EXISTS editorial_candidates_decided_by_idx
  ON public.editorial_candidates (decided_by);
CREATE INDEX IF NOT EXISTS notifications_actor_id_idx
  ON public.notifications (actor_id);
CREATE INDEX IF NOT EXISTS notifications_comment_id_idx
  ON public.notifications (comment_id);

COMMIT;
