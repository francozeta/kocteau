begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(11);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('72000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'authenticated', 'authenticated', 'summary-' || n || '@example.invalid',
  '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
from generate_series(1, 2) n;

insert into public.profiles (id, username, onboarded, taste_onboarded)
select ('72000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'summary_test_' || n, true, true
from generate_series(1, 2) n;

insert into public.entities (id, provider, provider_id, type, title)
values
  ('73000001-0000-4000-8000-000000000001', 'deezer', 'summary-track-one', 'track', 'Summary fixture'),
  ('73000002-0000-4000-8000-000000000002', 'deezer', 'summary-track-two', 'track', 'Other fixture'),
  ('73000003-0000-4000-8000-000000000003', 'deezer', 'summary-empty', 'track', 'Empty fixture');

insert into public.reviews (author_id, entity_id, rating)
values
  ('72000000-0000-4000-8000-000000000001', '73000001-0000-4000-8000-000000000001', 0.5),
  ('72000000-0000-4000-8000-000000000002', '73000001-0000-4000-8000-000000000001', 4.5),
  ('72000000-0000-4000-8000-000000000001', '73000002-0000-4000-8000-000000000002', 5);

select extensions.ok(to_regprocedure('public.get_entity_review_summary(uuid)') is not null,
  'summary function exists');
select extensions.ok(not (select prosecdef from pg_proc
  where oid = 'public.get_entity_review_summary(uuid)'::regprocedure),
  'summary uses caller permissions');
select extensions.ok(not exists (
  select 1 from pg_proc p,
    lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
  where p.oid = 'public.get_entity_review_summary(uuid)'::regprocedure
    and a.grantee = 0 and a.privilege_type = 'EXECUTE'
), 'PUBLIC has no implicit execute grant');
select extensions.ok(has_function_privilege('anon',
  'public.get_entity_review_summary(uuid)', 'execute'), 'anon may read summaries');
select extensions.ok(has_function_privilege('authenticated',
  'public.get_entity_review_summary(uuid)', 'execute'), 'authenticated may read summaries');

set local role anon;
select extensions.is((select review_count from public.get_entity_review_summary(
  '73000003-0000-4000-8000-000000000003')), 0::bigint, 'empty entity has zero reviews');
select extensions.is((select average_rating from public.get_entity_review_summary(
  '73000003-0000-4000-8000-000000000003')), null::numeric, 'empty entity has no average');
select extensions.is((select review_count from public.get_entity_review_summary(
  '73000001-0000-4000-8000-000000000001')), 2::bigint, 'count stays scoped to the entity');
select extensions.is((select average_rating from public.get_entity_review_summary(
  '73000001-0000-4000-8000-000000000001')), 2.5::numeric, 'average includes every visible rating');

reset role;
create policy summary_test_hidden_reviews on public.reviews
  as restrictive for select to anon using (false);
set local role anon;
select extensions.is((select review_count from public.get_entity_review_summary(
  '73000001-0000-4000-8000-000000000001')), 0::bigint, 'summary respects a restrictive read policy');
select extensions.is((select average_rating from public.get_entity_review_summary(
  '73000001-0000-4000-8000-000000000001')), null::numeric, 'hidden ratings do not enter the average');
reset role;

select * from extensions.finish();
rollback;
