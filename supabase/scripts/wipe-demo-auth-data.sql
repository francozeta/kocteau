-- Destructive manual script: wipe demo/test application data before OTP launch.
-- Run from Supabase SQL editor only after backing up and confirming this is not
-- a production database with real users.
--
-- This script intentionally does not drop tables, functions, buckets, RLS
-- policies, extensions, auth configuration, or secrets.

BEGIN;

LOCK TABLE
  public.analytics_events,
  public.notifications,
  public.entity_preference_tags,
  public.user_music_seeds,
  public.user_preference_tags,
  public.review_bookmarks,
  public.review_likes,
  public.entity_bookmarks,
  public.profile_follows,
  public.review_comments,
  public.reviews,
  public.entities,
  public.profiles
IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE _users_to_delete (
  id uuid PRIMARY KEY
) ON COMMIT DROP;

-- Current assumption: all existing users are demo/test users.
INSERT INTO _users_to_delete (id)
SELECT id
FROM auth.users;

-- Dependent app rows first.
DELETE FROM public.analytics_events;
DELETE FROM public.notifications;
DELETE FROM public.entity_preference_tags;
DELETE FROM public.user_music_seeds;
DELETE FROM public.user_preference_tags;
DELETE FROM public.review_bookmarks;
DELETE FROM public.review_likes;
DELETE FROM public.entity_bookmarks;
DELETE FROM public.profile_follows;
DELETE FROM public.review_comments;
DELETE FROM public.reviews;
DELETE FROM public.entities;
DELETE FROM public.profiles;

-- Auth rows last. Supabase-managed child rows normally cascade from auth.users.
DELETE FROM auth.users
WHERE id IN (SELECT id FROM _users_to_delete);

COMMIT;

-- Optional post-check:
-- SELECT 'auth.users' AS table_name, count(*) FROM auth.users
-- UNION ALL SELECT 'profiles', count(*) FROM public.profiles
-- UNION ALL SELECT 'entities', count(*) FROM public.entities
-- UNION ALL SELECT 'reviews', count(*) FROM public.reviews
-- UNION ALL SELECT 'review_comments', count(*) FROM public.review_comments
-- UNION ALL SELECT 'review_likes', count(*) FROM public.review_likes
-- UNION ALL SELECT 'review_bookmarks', count(*) FROM public.review_bookmarks
-- UNION ALL SELECT 'entity_bookmarks', count(*) FROM public.entity_bookmarks
-- UNION ALL SELECT 'profile_follows', count(*) FROM public.profile_follows
-- UNION ALL SELECT 'notifications', count(*) FROM public.notifications;
