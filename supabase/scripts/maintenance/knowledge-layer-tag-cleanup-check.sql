-- Verify the Knowledge Layer preference tag cleanup after applying
-- 20260627010620_knowledge_layer_tag_cleanup.sql.

WITH expected_kinds(slug, expected_kind) AS (
  VALUES
    ('dreamy', 'mood'::public.preference_kind),
    ('ambient-techno', 'genre'::public.preference_kind),
    ('jangle-pop', 'genre'::public.preference_kind),
    ('intelligent-dance-music-idm', 'genre'::public.preference_kind),
    ('1970s', 'era'::public.preference_kind),
    ('1980s', 'era'::public.preference_kind),
    ('1990s', 'era'::public.preference_kind),
    ('2000s', 'era'::public.preference_kind),
    ('2010s', 'era'::public.preference_kind),
    ('live-recordings', 'format'::public.preference_kind)
),
alias_slugs(slug) AS (
  VALUES
    ('seventies'),
    ('eighties'),
    ('nineties'),
    ('two-thousands'),
    ('twenty-tens'),
    ('live-sessions')
),
kind_checks AS (
  SELECT
    expected_kinds.slug,
    expected_kinds.expected_kind::text AS expected_kind,
    preference_tags.kind::text AS actual_kind,
    preference_tags.id IS NOT NULL AS exists
  FROM expected_kinds
  LEFT JOIN public.preference_tags
    ON preference_tags.slug = expected_kinds.slug
),
alias_checks AS (
  SELECT
    alias_slugs.slug,
    preference_tags.id IS NULL AS removed
  FROM alias_slugs
  LEFT JOIN public.preference_tags
    ON preference_tags.slug = alias_slugs.slug
)
SELECT
  'kind_check' AS check_type,
  slug,
  expected_kind,
  actual_kind,
  exists AND expected_kind = actual_kind AS ok
FROM kind_checks
UNION ALL
SELECT
  'alias_removed' AS check_type,
  slug,
  'missing' AS expected_kind,
  CASE WHEN removed THEN 'missing' ELSE 'present' END AS actual_kind,
  removed AS ok
FROM alias_checks
ORDER BY check_type, slug;
