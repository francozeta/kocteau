BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type') THEN
    CREATE TYPE public.entity_type AS ENUM ('track', 'album');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM ('review_liked', 'review_commented');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'preference_kind') THEN
    CREATE TYPE public.preference_kind AS ENUM ('genre', 'mood', 'scene', 'style', 'era', 'format');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  spotify_url text,
  apple_music_url text,
  deezer_url text,
  onboarded boolean NOT NULL DEFAULT false,
  taste_onboarded boolean NOT NULL DEFAULT false,
  is_official boolean NOT NULL DEFAULT false,
  official_label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_format
    CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,24}$')
);

CREATE TABLE IF NOT EXISTS public.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'deezer',
  provider_id text NOT NULL,
  type public.entity_type NOT NULL DEFAULT 'track',
  title text NOT NULL,
  artist_name text,
  cover_url text,
  deezer_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entities_provider_type_provider_id_key UNIQUE (provider, type, provider_id),
  CONSTRAINT entities_provider_check CHECK (provider = 'deezer')
);

CREATE TABLE IF NOT EXISTS public.preference_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.preference_kind NOT NULL,
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  is_featured boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT preference_tags_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS public.user_preference_tags (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.preference_tags(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'onboarding',
  weight numeric NOT NULL DEFAULT 1 CHECK (weight > 0 AND weight <= 3),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_preference_tags_pkey PRIMARY KEY (user_id, tag_id, source)
);

CREATE TABLE IF NOT EXISTS public.user_music_seeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES public.entities(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'deezer',
  provider_id text NOT NULL,
  type text NOT NULL DEFAULT 'track',
  title text NOT NULL,
  artist_name text,
  cover_url text,
  source text NOT NULL DEFAULT 'onboarding',
  weight numeric NOT NULL DEFAULT 1 CHECK (weight > 0 AND weight <= 3),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_music_seeds_user_provider_key UNIQUE (user_id, provider, provider_id, type)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  title text,
  body text,
  rating numeric NOT NULL CHECK (rating >= 0.5 AND rating <= 5),
  likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count integer NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_author_entity_key UNIQUE (author_id, entity_id)
);

CREATE TABLE IF NOT EXISTS public.review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.review_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_likes_pkey PRIMARY KEY (user_id, review_id)
);

CREATE TABLE IF NOT EXISTS public.review_bookmarks (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_bookmarks_pkey PRIMARY KEY (user_id, review_id)
);

CREATE TABLE IF NOT EXISTS public.entity_bookmarks (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entity_bookmarks_pkey PRIMARY KEY (user_id, entity_id)
);

CREATE TABLE IF NOT EXISTS public.profile_follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT profile_follows_not_self CHECK (follower_id <> following_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type public.notification_type NOT NULL,
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.review_comments(id) ON DELETE CASCADE,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rate_limit_windows (
  scope text NOT NULL,
  identifier text NOT NULL,
  window_start timestamp with time zone NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rate_limit_windows_pkey PRIMARY KEY (scope, identifier, window_start)
);

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS entities_provider_type_provider_id_idx ON public.entities (provider, type, provider_id);
CREATE INDEX IF NOT EXISTS preference_tags_featured_sort_idx ON public.preference_tags (is_featured, kind, sort_order);
CREATE INDEX IF NOT EXISTS user_preference_tags_tag_idx ON public.user_preference_tags (tag_id);
CREATE INDEX IF NOT EXISTS user_music_seeds_user_created_idx ON public.user_music_seeds (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_author_created_idx ON public.reviews (author_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS reviews_entity_created_idx ON public.reviews (entity_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS reviews_created_idx ON public.reviews (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS review_comments_review_created_idx ON public.review_comments (review_id, created_at);
CREATE INDEX IF NOT EXISTS review_likes_review_idx ON public.review_likes (review_id);
CREATE INDEX IF NOT EXISTS review_likes_user_review_idx ON public.review_likes (user_id, review_id);
CREATE INDEX IF NOT EXISTS review_bookmarks_review_idx ON public.review_bookmarks (review_id);
CREATE INDEX IF NOT EXISTS review_bookmarks_user_review_idx ON public.review_bookmarks (user_id, review_id);
CREATE INDEX IF NOT EXISTS entity_bookmarks_user_entity_idx ON public.entity_bookmarks (user_id, entity_id);
CREATE INDEX IF NOT EXISTS profile_follows_follower_following_idx ON public.profile_follows (follower_id, following_id);
CREATE INDEX IF NOT EXISTS profile_follows_following_idx ON public.profile_follows (following_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx ON public.notifications (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON public.notifications (recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_review_idx ON public.notifications (review_id);
CREATE INDEX IF NOT EXISTS rate_limit_windows_updated_idx ON public.rate_limit_windows (updated_at);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_entities_updated_at ON public.entities;
CREATE TRIGGER set_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_preference_tags_updated_at ON public.user_preference_tags;
CREATE TRIGGER set_user_preference_tags_updated_at
  BEFORE UPDATE ON public.user_preference_tags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_review_comments_updated_at ON public.review_comments;
CREATE TRIGGER set_review_comments_updated_at
  BEFORE UPDATE ON public.review_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preference_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preference_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_music_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are readable" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Entities are readable" ON public.entities
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated users can create Deezer entities" ON public.entities
  FOR INSERT TO authenticated WITH CHECK (provider = 'deezer');

CREATE POLICY "Preference tags are readable" ON public.preference_tags
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can read their taste tags" ON public.user_preference_tags
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their taste tags" ON public.user_preference_tags
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their taste tags" ON public.user_preference_tags
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their taste tags" ON public.user_preference_tags
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage their music seeds" ON public.user_music_seeds
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Reviews are readable" ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert their reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update their reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can delete their reviews" ON public.reviews
  FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "Review comments are readable" ON public.review_comments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert their comments" ON public.review_comments
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update their comments" ON public.review_comments
  FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users and review authors can delete comments" ON public.review_comments
  FOR DELETE TO authenticated USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_comments.review_id
        AND reviews.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can read relevant review likes" ON public.review_likes
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_likes.review_id
        AND reviews.author_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their review likes" ON public.review_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users and review authors can delete review likes" ON public.review_likes
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_likes.review_id
        AND reviews.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their review bookmarks" ON public.review_bookmarks
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their review bookmarks" ON public.review_bookmarks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users and review authors can delete review bookmarks" ON public.review_bookmarks
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_bookmarks.review_id
        AND reviews.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their entity bookmarks" ON public.entity_bookmarks
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their follows" ON public.profile_follows
  FOR SELECT TO authenticated USING (follower_id = auth.uid());
CREATE POLICY "Users can insert their follows" ON public.profile_follows
  FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can delete their follows" ON public.profile_follows
  FOR DELETE TO authenticated USING (follower_id = auth.uid());

CREATE POLICY "Users can read their notifications" ON public.notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY "Review authors can delete review notifications" ON public.notifications
  FOR DELETE TO authenticated USING (
    recipient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = notifications.review_id
        AND reviews.author_id = auth.uid()
    )
  );

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles, public.entities, public.preference_tags, public.reviews, public.review_comments TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.entities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preference_tags, public.user_music_seeds, public.review_likes, public.review_bookmarks, public.entity_bookmarks, public.profile_follows TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews, public.review_comments TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Avatar objects are public" ON storage.objects;
CREATE POLICY "Avatar objects are public"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type public.notification_type,
  p_review_id uuid DEFAULT NULL,
  p_comment_id uuid DEFAULT NULL
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_notification public.notifications%rowtype;
BEGIN
  IF p_recipient_id IS NULL OR p_actor_id IS NULL OR p_recipient_id = p_actor_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    review_id,
    comment_id
  )
  VALUES (
    p_recipient_id,
    p_actor_id,
    p_type,
    p_review_id,
    p_comment_id
  )
  RETURNING * INTO v_notification;

  RETURN v_notification;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_review_with_entity(
  p_provider text,
  p_provider_id text,
  p_type public.entity_type,
  p_title text,
  p_artist_name text DEFAULT NULL,
  p_cover_url text DEFAULT NULL,
  p_deezer_url text DEFAULT NULL,
  p_review_title text DEFAULT NULL,
  p_review_body text DEFAULT NULL,
  p_rating numeric DEFAULT NULL,
  p_is_pinned boolean DEFAULT false
)
RETURNS TABLE (entity_id uuid, review_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_entity_id uuid;
  v_review_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
  END IF;

  IF p_provider <> 'deezer' THEN
    RAISE EXCEPTION 'Unsupported provider.' USING ERRCODE = '22023';
  END IF;

  IF p_rating IS NULL OR p_rating < 0.5 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Invalid rating.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.entities (
    provider,
    provider_id,
    type,
    title,
    artist_name,
    cover_url,
    deezer_url,
    updated_at
  )
  VALUES (
    p_provider,
    p_provider_id,
    p_type,
    p_title,
    p_artist_name,
    p_cover_url,
    p_deezer_url,
    now()
  )
  ON CONFLICT (provider, type, provider_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    artist_name = EXCLUDED.artist_name,
    cover_url = EXCLUDED.cover_url,
    deezer_url = EXCLUDED.deezer_url,
    updated_at = now()
  RETURNING id INTO v_entity_id;

  INSERT INTO public.reviews (
    author_id,
    entity_id,
    title,
    body,
    rating,
    is_pinned
  )
  VALUES (
    v_user_id,
    v_entity_id,
    p_review_title,
    p_review_body,
    p_rating,
    coalesce(p_is_pinned, false)
  )
  RETURNING id INTO v_review_id;

  RETURN QUERY SELECT v_entity_id, v_review_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reconcile_review_comments_count(
  p_review_id uuid
)
RETURNS TABLE (review_id uuid, comments_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH counted AS (
    SELECT count(*)::integer AS value
    FROM public.review_comments
    WHERE review_comments.review_id = p_review_id
  ),
  updated AS (
    UPDATE public.reviews
    SET comments_count = counted.value,
        updated_at = now()
    FROM counted
    WHERE reviews.id = p_review_id
    RETURNING reviews.id, reviews.comments_count
  )
  SELECT updated.id, updated.comments_count
  FROM updated;
$$;

CREATE OR REPLACE FUNCTION public.get_viewer_review_collection_state(
  p_review_ids uuid[]
)
RETURNS TABLE (review_id uuid, liked boolean, bookmarked boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    review_id,
    EXISTS (
      SELECT 1
      FROM public.review_likes
      WHERE review_likes.review_id = review_id
        AND review_likes.user_id = auth.uid()
    ) AS liked,
    EXISTS (
      SELECT 1
      FROM public.review_bookmarks
      WHERE review_bookmarks.review_id = review_id
        AND review_bookmarks.user_id = auth.uid()
    ) AS bookmarked
  FROM unnest(coalesce(p_review_ids, ARRAY[]::uuid[])) AS review_id;
$$;

CREATE OR REPLACE FUNCTION public.toggle_review_like(
  p_review_id uuid
)
RETURNS TABLE (liked boolean, likes_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_review_author_id uuid;
  v_liked boolean;
  v_likes_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
  END IF;

  SELECT author_id INTO v_review_author_id
  FROM public.reviews
  WHERE id = p_review_id;

  IF v_review_author_id IS NULL THEN
    RAISE EXCEPTION 'Review not found.' USING ERRCODE = '02000';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.review_likes
    WHERE review_id = p_review_id AND user_id = v_user_id
  ) THEN
    DELETE FROM public.review_likes
    WHERE review_id = p_review_id AND user_id = v_user_id;

    UPDATE public.reviews
    SET likes_count = greatest(likes_count - 1, 0),
        updated_at = now()
    WHERE id = p_review_id
    RETURNING reviews.likes_count INTO v_likes_count;

    v_liked := false;
  ELSE
    INSERT INTO public.review_likes (review_id, user_id)
    VALUES (p_review_id, v_user_id);

    UPDATE public.reviews
    SET likes_count = likes_count + 1,
        updated_at = now()
    WHERE id = p_review_id
    RETURNING reviews.likes_count INTO v_likes_count;

    PERFORM public.create_notification(
      v_review_author_id,
      v_user_id,
      'review_liked',
      p_review_id,
      NULL
    );

    v_liked := true;
  END IF;

  RETURN QUERY SELECT v_liked, v_likes_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_review_bookmark(
  p_review_id uuid
)
RETURNS TABLE (review_id uuid, bookmarked boolean, saved_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_saved_at timestamp with time zone;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.reviews WHERE id = p_review_id) THEN
    RAISE EXCEPTION 'Review not found.' USING ERRCODE = '02000';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.review_bookmarks
    WHERE review_bookmarks.review_id = p_review_id
      AND review_bookmarks.user_id = v_user_id
  ) THEN
    DELETE FROM public.review_bookmarks
    WHERE review_bookmarks.review_id = p_review_id
      AND review_bookmarks.user_id = v_user_id;

    RETURN QUERY SELECT p_review_id, false, NULL::timestamp with time zone;
  ELSE
    INSERT INTO public.review_bookmarks (review_id, user_id)
    VALUES (p_review_id, v_user_id)
    RETURNING created_at INTO v_saved_at;

    RETURN QUERY SELECT p_review_id, true, v_saved_at;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_profile_follow(
  p_target_profile_id uuid
)
RETURNS TABLE (follower_id uuid, following_id uuid, following boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
  END IF;

  IF v_user_id = p_target_profile_id THEN
    RAISE EXCEPTION 'Cannot follow yourself.' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_profile_id) THEN
    RAISE EXCEPTION 'Profile not found.' USING ERRCODE = '02000';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profile_follows
    WHERE profile_follows.follower_id = v_user_id
      AND profile_follows.following_id = p_target_profile_id
  ) THEN
    DELETE FROM public.profile_follows
    WHERE profile_follows.follower_id = v_user_id
      AND profile_follows.following_id = p_target_profile_id;

    RETURN QUERY SELECT v_user_id, p_target_profile_id, false;
  ELSE
    INSERT INTO public.profile_follows (follower_id, following_id)
    VALUES (v_user_id, p_target_profile_id);

    RETURN QUERY SELECT v_user_id, p_target_profile_id, true;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_scope text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE (
  ok boolean,
  current_count integer,
  remaining integer,
  reset_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamp with time zone;
  v_count integer;
  v_reset_at timestamp with time zone;
BEGIN
  IF p_limit <= 0 OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration.' USING ERRCODE = '22023';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  INSERT INTO public.rate_limit_windows (
    scope,
    identifier,
    window_start,
    request_count,
    updated_at
  )
  VALUES (
    p_scope,
    p_identifier,
    v_window_start,
    1,
    now()
  )
  ON CONFLICT (scope, identifier, window_start)
  DO UPDATE SET
    request_count = public.rate_limit_windows.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_count;

  RETURN QUERY
  SELECT
    v_count <= p_limit,
    v_count,
    greatest(p_limit - v_count, 0),
    v_reset_at;
END;
$$;

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
  boolean
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_review_comments_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_viewer_review_collection_state(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_review_like(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_review_bookmark(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_profile_follow(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, uuid, public.notification_type, uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_review_with_entity(text, text, public.entity_type, text, text, text, text, text, text, numeric, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reconcile_review_comments_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_viewer_review_collection_state(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_review_like(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_review_bookmark(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_profile_follow(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_notification(uuid, uuid, public.notification_type, uuid, uuid) FROM PUBLIC;

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
  boolean
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_review_comments_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_viewer_review_collection_state(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_review_like(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_review_bookmark(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_profile_follow(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, uuid, public.notification_type, uuid, uuid) TO authenticated;

COMMIT;
