-- Kocteau lightweight product analytics.
-- Run from the Supabase SQL editor after v0.1.2.
--
-- This is intentionally small: authenticated users can insert their own events,
-- clients cannot read the table directly, and metadata is bounded JSONB.

BEGIN;

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type ~ '^[a-z0-9_]{3,64}$'),
  source text NOT NULL DEFAULT 'web'
    CHECK (source ~ '^[a-z0-9_:-]{2,80}$'),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object' AND pg_column_size(metadata) <= 4096),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_user_created_idx
  ON public.analytics_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx
  ON public.analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_created_idx
  ON public.analytics_events (created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own analytics events" ON public.analytics_events;

CREATE POLICY "Users can insert their own analytics events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

GRANT INSERT ON public.analytics_events TO authenticated;

COMMIT;
