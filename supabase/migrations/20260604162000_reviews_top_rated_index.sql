BEGIN;

CREATE INDEX IF NOT EXISTS reviews_rating_created_idx
  ON public.reviews (rating DESC, created_at DESC, id DESC);

COMMIT;
