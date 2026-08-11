-- Curator applications and an admin-only decision flow.
-- External editorial sources remain candidate signals and never publish reviews.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

CREATE OR REPLACE FUNCTION public.is_kocteau_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_roles role
    WHERE role.user_id = auth.uid()
      AND role.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_kocteau_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_kocteau_admin() TO authenticated;

CREATE TABLE public.curator_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  taste_focus text NOT NULL,
  motivation text NOT NULL,
  sample_links text[] NOT NULL DEFAULT ARRAY[]::text[],
  availability text NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  decision_note text,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT curator_applications_taste_focus_check
    CHECK (char_length(btrim(taste_focus)) BETWEEN 20 AND 600),
  CONSTRAINT curator_applications_motivation_check
    CHECK (char_length(btrim(motivation)) BETWEEN 40 AND 1200),
  CONSTRAINT curator_applications_sample_links_check
    CHECK (
      cardinality(sample_links) <= 3
      AND array_position(sample_links, NULL) IS NULL
    ),
  CONSTRAINT curator_applications_availability_check
    CHECK (availability IN ('occasional', 'weekly', 'frequent')),
  CONSTRAINT curator_applications_status_check
    CHECK (status IN ('submitted', 'reviewing', 'accepted', 'declined')),
  CONSTRAINT curator_applications_decision_note_check
    CHECK (decision_note IS NULL OR char_length(decision_note) <= 600)
);

CREATE UNIQUE INDEX curator_applications_one_active_per_user_idx
  ON public.curator_applications (user_id)
  WHERE status IN ('submitted', 'reviewing', 'accepted');

CREATE INDEX curator_applications_status_submitted_idx
  ON public.curator_applications (status, submitted_at ASC);

ALTER TABLE public.curator_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own curator applications"
  ON public.curator_applications
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can read curator applications"
  ON public.curator_applications
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_kocteau_admin()));

CREATE POLICY "Users can submit their own curator applications"
  ON public.curator_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'submitted'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

GRANT SELECT, INSERT ON public.curator_applications TO authenticated;

CREATE OR REPLACE FUNCTION public.decide_curator_application(
  p_application_id uuid,
  p_status text,
  p_decision_note text DEFAULT NULL
)
RETURNS public.curator_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_application public.curator_applications%rowtype;
BEGIN
  IF NOT public.is_kocteau_admin() THEN
    RAISE EXCEPTION 'Not allowed to decide curator applications.'
      USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('reviewing', 'accepted', 'declined') THEN
    RAISE EXCEPTION 'Curator application status is invalid.'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_application
  FROM public.curator_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Curator application not found.'
      USING ERRCODE = '02000';
  END IF;

  IF v_application.status IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Curator application has already been decided.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.curator_applications
  SET
    status = p_status,
    decision_note = nullif(btrim(coalesce(p_decision_note, '')), ''),
    reviewed_by = auth.uid(),
    reviewed_at = CASE
      WHEN p_status IN ('accepted', 'declined') THEN now()
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_application_id
  RETURNING * INTO v_application;

  IF p_status = 'accepted' THEN
    INSERT INTO public.profile_roles (user_id, role)
    VALUES (v_application.user_id, 'curator')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN v_application;
END;
$$;

REVOKE ALL ON FUNCTION public.decide_curator_application(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decide_curator_application(uuid, text, text)
  TO authenticated;

COMMENT ON TABLE public.curator_applications IS
  'User-submitted applications for Kocteau editorial curator access.';

ALTER TABLE public.editorial_candidates
  DROP CONSTRAINT editorial_candidates_source_check;

ALTER TABLE public.editorial_candidates
  ADD CONSTRAINT editorial_candidates_source_check
  CHECK (
    source IN (
      'related-seed',
      'deep-cut',
      'manual',
      'system-signal',
      'external-source'
    )
  );

COMMIT;
