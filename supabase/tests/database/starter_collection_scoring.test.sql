begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(18);

update public.starter_tracks set is_active = false;
insert into auth.users (
  id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('62000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'starter-collection-a@example.invalid', now(), '{}', '{}', now(), now()),
  ('62000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'starter-collection-b@example.invalid', now(), '{}', '{}', now(), now());
insert into public.profiles (id, username, onboarded, taste_onboarded)
values
  ('62000000-0000-4000-8000-000000000001', 'starter_collection_a', true, true),
  ('62000000-0000-4000-8000-000000000002', 'starter_collection_b', true, true);
insert into public.preference_tags (id, kind, slug, label)
values
  (md5('collection-score-tag-1')::uuid, 'genre', 'collection-score-tag-1', 'Collection score tag 1'),
  (md5('collection-score-tag-2')::uuid, 'mood', 'collection-score-tag-2', 'Collection score tag 2');
insert into public.user_preference_tags (user_id, tag_id, weight, source)
values
  ('62000000-0000-4000-8000-000000000001', md5('collection-score-tag-1')::uuid, 0.5, 'onboarding'),
  ('62000000-0000-4000-8000-000000000001', md5('collection-score-tag-1')::uuid, 0.25, 'inferred'),
  ('62000000-0000-4000-8000-000000000001', md5('collection-score-tag-2')::uuid, 1.2, 'onboarding');
insert into public.starter_tracks (
  id, provider_id, title, artist_name, cover_url, prompt, editorial_note,
  is_active, is_featured, sort_order
)
values (
  md5('collection-score-track')::uuid, 'collection-score-track', 'Collection score track',
  'Local fixture artist', 'https://example.invalid/collection-score.jpg',
  'Local fixture prompt', 'Local fixture note', true, true, 1
);
insert into public.starter_track_tags (starter_track_id, tag_id, weight)
values
  (md5('collection-score-track')::uuid, md5('collection-score-tag-1')::uuid, 0.8),
  (md5('collection-score-track')::uuid, md5('collection-score-tag-2')::uuid, 0.5);
insert into public.editorial_collections (id, slug, title, is_published, sort_order)
values
  (md5('collection-score-private')::uuid, 'collection-score-private', 'Private fixture', false, 0),
  (md5('collection-score-first')::uuid, 'collection-score-first', 'First fixture', true, 10),
  (md5('collection-score-second')::uuid, 'collection-score-second', 'Second fixture', true, 20);
insert into public.starter_sources (id, provider, provider_source_id, title, url, is_active)
values (
  md5('collection-score-source')::uuid, 'apple_music', 'collection-score-source',
  'Local fixture source', 'https://example.invalid/source', true
);
insert into public.starter_source_items (
  source_id, source_item_id, source_position, title, starter_track_id, status
)
values (
  md5('collection-score-source')::uuid, 'collection-score-source-item', 1,
  'Local source track', md5('collection-score-track')::uuid, 'synced'
);

select set_config('request.jwt.claim.sub', '62000000-0000-4000-8000-000000000001', true);
create temporary table collection_score_baseline as
select * from public.get_starter_tracks_for_surface(12, 'home', 'collection-score');
grant select on collection_score_baseline to authenticated;
set local role authenticated;
select extensions.is((select count(*)::integer from collection_score_baseline), 1,
  'fixture has one eligible pick in both recommendation lanes');
select extensions.is((select matched_tag_count from collection_score_baseline), 2,
  'multiple preference sources keep distinct tag matches');
select extensions.ok((select to_jsonb(f) @> jsonb_build_object(
  'title', 'Collection score track', 'artist_name', 'Local fixture artist',
  'cover_url', 'https://example.invalid/collection-score.jpg',
  'prompt', 'Local fixture prompt', 'editorial_note', 'Local fixture note'
) from collection_score_baseline f), 'public content survives late hydration');
reset role;

insert into public.editorial_collection_items (collection_id, starter_track_id, position)
values (md5('collection-score-private')::uuid, md5('collection-score-track')::uuid, 1);
set local role authenticated;
select extensions.results_eq(
  'select to_jsonb(f) from public.get_starter_tracks_for_surface(12, ''home'', ''collection-score'') f',
  'select to_jsonb(f) from collection_score_baseline f',
  'an unpublished membership changes neither taste nor public output');
reset role;

insert into public.editorial_collection_items (collection_id, starter_track_id, position)
values (md5('collection-score-first')::uuid, md5('collection-score-track')::uuid, 2);
create temporary table collection_score_published as
select * from public.get_starter_tracks_for_surface(12, 'home', 'collection-score');
grant select on collection_score_published to authenticated;
set local role authenticated;
select extensions.is((select score from collection_score_published),
  (select score + 0.2 from collection_score_baseline),
  'first published membership adds only the existing editorial bonus');
select extensions.is((select collection_slug from collection_score_published), 'collection-score-first',
  'unpublished collection is excluded from public metadata');
select extensions.is((select matched_tag_count from collection_score_published), 2,
  'published membership does not change distinct taste matches');
reset role;

insert into public.editorial_collection_items (collection_id, starter_track_id, position)
values (md5('collection-score-second')::uuid, md5('collection-score-track')::uuid, 3);
set local role authenticated;
select extensions.results_eq(
  'select to_jsonb(f) from public.get_starter_tracks_for_surface(12, ''home'', ''collection-score'') f',
  'select to_jsonb(f) from collection_score_published f',
  'second published membership cannot multiply taste or duplicate the pick');
select extensions.results_eq(
  'select to_jsonb(f) from public.get_starter_tracks_for_surface(12, ''track'', ''fixed-context'') f',
  'select to_jsonb(f) from public.get_starter_tracks_for_surface(12, ''track'', ''fixed-context'') f',
  'fixed surface and context retain deterministic output');
select extensions.is((select count(*)::integer from public.get_starter_tracks_for_surface(
  12, 'home', 'collection-score', array['collection-score-track'])), 0,
  'provider exclusions still apply to a multicollection source pick');
reset role;

update public.editorial_collections set is_published = true
where id = md5('collection-score-private')::uuid;
set local role authenticated;
select extensions.is((select score from public.get_starter_tracks_for_surface(12, 'home', 'collection-score')),
  (select score from collection_score_published), 'publishing another collection leaves taste and bonus unchanged');
select extensions.is((select collection_slug from public.get_starter_tracks_for_surface(12, 'home', 'collection-score')),
  'collection-score-private', 'published metadata still follows editorial collection order');
reset role;

update public.editorial_collections set is_published = false
where id in (md5('collection-score-private')::uuid, md5('collection-score-first')::uuid, md5('collection-score-second')::uuid);
set local role authenticated;
select extensions.results_eq(
  'select to_jsonb(f) from public.get_starter_tracks_for_surface(12, ''home'', ''collection-score'') f',
  'select to_jsonb(f) from collection_score_baseline f',
  'removing publication restores output despite retained private memberships');
reset role;
select set_config('request.jwt.claim.sub', '62000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is((select matched_tag_count from public.get_starter_tracks_for_surface(12, 'home', 'collection-score')),
  0, 'another caller cannot inherit the first callers tags');
reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role authenticated;
select extensions.is((select matched_tag_count from public.get_starter_tracks_for_surface(12, 'home', 'collection-score')),
  0, 'absent caller cannot inherit taste through collection memberships');
reset role;
select extensions.ok(has_function_privilege('authenticated', 'public.get_starter_tracks_for_surface(integer,text,text,text[])', 'execute')
  and not has_function_privilege('anon', 'public.get_starter_tracks_for_surface(integer,text,text,text[])', 'execute'),
  'function replacement retains the local execute grants');
select extensions.ok((select prosecdef and proconfig = array['search_path=""'] from pg_proc
  where oid = 'public.get_starter_tracks_for_surface(integer,text,text,text[])'::regprocedure),
  'existing definer boundary and empty search path remain unchanged');
select extensions.is((select provolatile::text from pg_proc
  where oid = 'public.get_starter_tracks_for_surface(integer,text,text,text[])'::regprocedure),
  's', 'function remains stable');
select * from extensions.finish();
rollback;
