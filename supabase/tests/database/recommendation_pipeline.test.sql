begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(9);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'recommendation-viewer@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'recommendation-followed@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'recommendation-entity-taste@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'recommendation-author-taste@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

update public.profiles
set
  username = 'rec_test_' || right(id::text, 1),
  onboarded = true,
  taste_onboarded = true
where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004'
);

insert into public.entities (
  id,
  type,
  provider,
  provider_id,
  title,
  artist_name
)
values
  (
    '20000001-0000-4000-8000-000000000001',
    'track',
    'test',
    'recommendation-entity-taste',
    'Entity taste fixture',
    'Kocteau tests'
  ),
  (
    '20000002-0000-4000-8000-000000000002',
    'track',
    'test',
    'recommendation-own-review',
    'Own review fixture',
    'Kocteau tests'
  ),
  (
    '20000003-0000-4000-8000-000000000003',
    'track',
    'test',
    'recommendation-author-signals',
    'Author signals fixture',
    'Kocteau tests'
  );

insert into public.preference_tags (
  id,
  kind,
  slug,
  label,
  is_featured
)
values (
  '30000000-0000-4000-8000-000000000001',
  'genre',
  'recommendation-test-genre',
  'Recommendation test genre',
  false
);

insert into public.user_preference_tags (user_id, tag_id, weight, source)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    1,
    'onboarding'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000001',
    1,
    'onboarding'
  );

insert into public.entity_preference_tags (entity_id, tag_id, source, weight)
values (
  '20000001-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'manual',
  1
);

insert into public.profile_follows (follower_id, following_id)
values (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002'
);

insert into public.reviews (
  id,
  author_id,
  entity_id,
  rating,
  title,
  body,
  created_at,
  updated_at
)
values
  (
    '40000001-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000002-0000-4000-8000-000000000002',
    4.5,
    'Own review',
    'The viewer should never receive this review as a recommendation.',
    now() - interval '1 hour',
    now() - interval '1 hour'
  ),
  (
    '40000002-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '20000003-0000-4000-8000-000000000003',
    4.5,
    'Followed author',
    'This review exists to preserve the followed-author explanation.',
    now() - interval '2 hours',
    now() - interval '2 hours'
  ),
  (
    '40000003-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    '20000001-0000-4000-8000-000000000001',
    4.5,
    'Entity taste',
    'This review exists to preserve the entity-taste explanation.',
    now() - interval '3 hours',
    now() - interval '3 hours'
  ),
  (
    '40000004-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    '20000003-0000-4000-8000-000000000003',
    4.5,
    'Author taste',
    'This review exists to preserve the author-taste explanation.',
    now() - interval '4 hours',
    now() - interval '4 hours'
  ),
  (
    '40000005-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000003',
    '20000002-0000-4000-8000-000000000002',
    4.5,
    'Expired review',
    'This old review should stay outside the recommendation window.',
    now() - interval '366 days',
    now() - interval '366 days'
  );

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.get_recommended_review_ids(integer,numeric,timestamp with time zone,uuid)',
    'EXECUTE'
  ),
  'authenticated users can execute the recommendation RPC'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.get_recommended_review_ids(integer,numeric,timestamp with time zone,uuid)',
    'EXECUTE'
  ),
  'anonymous users cannot execute the recommendation RPC'
);

set local "request.jwt.claim.sub" = '';

select extensions.is_empty(
  'select * from public.get_recommended_review_ids(8, null, null, null)',
  'a missing viewer produces no personalized recommendations'
);

set local "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';

select extensions.ok(
  not exists (
    select 1
    from public.get_recommended_review_ids(30, null, null, null)
    where review_id = '40000001-0000-4000-8000-000000000001'
  ),
  'the viewer own review is excluded'
);

select extensions.is(
  (
    select reason
    from public.get_recommended_review_ids(30, null, null, null)
    where review_id = '40000003-0000-4000-8000-000000000003'
  ),
  'entity_taste',
  'entity taste remains the strongest explanation'
);

select extensions.is(
  (
    select reason
    from public.get_recommended_review_ids(30, null, null, null)
    where review_id = '40000002-0000-4000-8000-000000000002'
  ),
  'following',
  'followed authors retain a clear explanation'
);

select extensions.is(
  (
    select reason
    from public.get_recommended_review_ids(30, null, null, null)
    where review_id = '40000004-0000-4000-8000-000000000004'
  ),
  'taste_match',
  'author taste retains a clear explanation'
);

select extensions.ok(
  not exists (
    select 1
    from public.get_recommended_review_ids(30, null, null, null)
    where review_id = '40000005-0000-4000-8000-000000000005'
  ),
  'reviews older than the editorial window are excluded'
);

select extensions.ok(
  (
    select count(*)
    from public.get_recommended_review_ids(999, null, null, null)
  ) <= 31,
  'the public page size stays bounded'
);

select * from extensions.finish();

rollback;
