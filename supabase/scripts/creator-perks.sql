-- Creator perks unlock after a listener publishes their first valid review.

CREATE TABLE IF NOT EXISTS public.user_creator_perks (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  perk_key text NOT NULL DEFAULT 'first_reviewer_v0_builder',
  first_review_id uuid REFERENCES public.reviews(id) ON DELETE SET NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_creator_perks_pkey PRIMARY KEY (user_id, perk_key),
  CONSTRAINT user_creator_perks_supported_key CHECK (perk_key = 'first_reviewer_v0_builder')
);

CREATE INDEX IF NOT EXISTS user_creator_perks_first_review_idx
  ON public.user_creator_perks (first_review_id);

ALTER TABLE public.user_creator_perks
  ALTER COLUMN first_review_id DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'user_creator_perks'
      AND constraint_name = 'user_creator_perks_first_review_id_fkey'
  ) THEN
    ALTER TABLE public.user_creator_perks
      DROP CONSTRAINT user_creator_perks_first_review_id_fkey;
  END IF;
END;
$$;

ALTER TABLE public.user_creator_perks
  ADD CONSTRAINT user_creator_perks_first_review_id_fkey
  FOREIGN KEY (first_review_id)
  REFERENCES public.reviews(id)
  ON DELETE SET NULL;

ALTER TABLE public.user_creator_perks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own creator perks"
  ON public.user_creator_perks;

DROP POLICY IF EXISTS "Creator perks are public profile badges"
  ON public.user_creator_perks;

CREATE POLICY "Creator perks are public profile badges"
  ON public.user_creator_perks
  FOR SELECT
  USING (true);

GRANT SELECT ON public.user_creator_perks TO anon;
GRANT SELECT ON public.user_creator_perks TO authenticated;

CREATE OR REPLACE FUNCTION public.unlock_first_review_creator_perk()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.reviews existing_review
    WHERE existing_review.author_id = NEW.author_id
      AND existing_review.id <> NEW.id
    LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_creator_perks (
    user_id,
    perk_key,
    first_review_id
  )
  VALUES (
    NEW.author_id,
    'first_reviewer_v0_builder',
    NEW.id
  )
  ON CONFLICT (user_id, perk_key) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_first_review_creator_perk() FROM PUBLIC;

DROP TRIGGER IF EXISTS unlock_first_review_creator_perk_on_review
  ON public.reviews;

CREATE TRIGGER unlock_first_review_creator_perk_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.unlock_first_review_creator_perk();
