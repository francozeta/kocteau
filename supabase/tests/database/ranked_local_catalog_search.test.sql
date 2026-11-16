begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(26);

insert into public.entities (id, provider_id, type, title, artist_name)
select ('a1' || lpad(to_hex(n), 6, '0') || '-1111-4000-8000-000000000001')::uuid,
  'ranked-search-' || n, 'track',
  case when n >= 30 then 'TARGET' when n >= 28 then 'Target prefix ' || n else 'Contains target ' || n end,
  case when n >= 30 then 'Target Artist' else 'Contains Target Artist ' || n end
from generate_series(1, 31) n;
insert into public.entities (id, provider_id, type, title, artist_name)
values ('a1000100-1111-4000-8000-000000000001', 'ranked-search-album', 'album', 'Target', 'Target Artist'),
 ('a1000101-1111-4000-8000-000000000001', 'ranked-search-percent', 'track', '50%_discount', null),
 ('a1000102-1111-4000-8000-000000000001', 'ranked-search-slash', 'track', E'Path\\music', null),
 ('a1000103-1111-4000-8000-000000000001', 'ranked-search-unicode', 'track', '東京', null),
 ('a1000104-1111-4000-8000-000000000001', 'ranked-search-accent', 'track', 'Björk', null),
 ('a1000105-1111-4000-8000-000000000001', 'ranked-search-decoy', 'track', '500Xdiscount', null);
insert into public.artists (id, provider_id, name)
select ('a2' || lpad(to_hex(n), 6, '0') || '-1111-4000-8000-000000000001')::uuid,
  'ranked-search-artist-' || n,
  case when n = 30 then 'Target Artist' else 'Contains Target Artist ' || n end
from generate_series(1, 30) n;
insert into public.starter_tracks (id, provider_id, title, artist_name, sort_order, is_active)
select ('a3' || lpad(to_hex(n), 6, '0') || '-1111-4000-8000-000000000001')::uuid,
  'ranked-search-starter-' || n,
  case when n = 30 then 'Target' when n = 31 then 'Target hidden' else 'Contains target ' || n end,
  case when n = 30 then 'Target Artist' else 'Contains Target Artist ' || n end,
  n, n <> 31
from generate_series(1, 31) n;

select extensions.ok(not exists (
 select from pg_proc p where p.oid in (
  'public.search_local_entities(text,public.entity_type,text,integer)'::regprocedure,
  'public.search_local_artists(text,integer)'::regprocedure,
  'public.search_local_starter_tracks(text,text,integer)'::regprocedure)
 and (p.prosecdef or p.provolatile <> 's')
), 'all search functions are stable invokers');
select extensions.ok(not exists (
 select from pg_proc p, lateral aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) a
 where p.proname like 'search_local_%' and a.grantee = 0 and a.privilege_type = 'EXECUTE'
), 'PUBLIC has no implicit execute grant');
select extensions.ok(not exists (select from pg_proc where proname like 'search_local_%' and prorows <> 18), 'planner row estimate reflects the bounded branch size');
select extensions.ok(has_function_privilege('anon', 'public.search_local_entities(text,public.entity_type,text,integer)', 'execute'), 'anon can search entities');
select extensions.ok(has_function_privilege('authenticated', 'public.search_local_artists(text,integer)', 'execute'), 'authenticated can search artists');

set local role anon;
select extensions.is((select provider_id from public.search_local_entities('target','track','title',18) limit 1), 'ranked-search-30', 'exact title survives ahead of more than eighteen substring matches');
select extensions.is((select count(*) from public.search_local_entities('target','track','title',1000)), 18::bigint, 'entities cap each branch at eighteen');
select extensions.is((select array_agg(provider_id) from (select provider_id from public.search_local_entities('target','track','title',4)) s), array['ranked-search-30','ranked-search-31','ranked-search-28','ranked-search-29'], 'exact then prefix order uses stable ID ties');
select extensions.is((select provider_id from public.search_local_entities('Target Artist','track','artist_name') limit 1), 'ranked-search-30', 'artist branch ranks independently before its limit');
select extensions.is((select count(*) from public.search_local_entities('target','album','title')), 1::bigint, 'album retrieval stays separate from track');
select extensions.is((select count(*) from public.search_local_entities('target','track','invalid')), 0::bigint, 'unknown branch cannot become a wide query');
select extensions.is((select count(*) from public.search_local_entities('','track','title')), 0::bigint, 'empty query cannot scan all candidates');
select extensions.is((select count(*) from public.search_local_entities(repeat('a',81),'track','title')), 0::bigint, 'overlong query is bounded');
select extensions.is((select count(*) from public.search_local_entities('target','track','title',0)), 0::bigint, 'zero limit stays empty');
select extensions.is((select provider_id from public.search_local_entities('%','track','title')), 'ranked-search-percent', 'percent is literal');
select extensions.is((select provider_id from public.search_local_entities('_','track','title')), 'ranked-search-percent', 'underscore is literal');
select extensions.is((select provider_id from public.search_local_entities(E'\\','track','title')), 'ranked-search-slash', 'backslash is literal');
select extensions.is((select provider_id from public.search_local_entities('東京','track','title')), 'ranked-search-unicode', 'non-Latin text is preserved');
select extensions.is((select provider_id from public.search_local_entities('björk','track','title')), 'ranked-search-accent', 'accented names retain PostgreSQL case-insensitive matching');
select extensions.is((select provider_id from public.search_local_artists('Target Artist') limit 1), 'ranked-search-artist-30', 'artist exact match survives its branch limit');
select extensions.is((select count(*) from public.search_local_artists('Target Artist',1000)), 18::bigint, 'artist branch is bounded');
select extensions.is((select provider_id from public.search_local_starter_tracks('target','title') limit 1), 'ranked-search-starter-30', 'Starter exact match precedes editorial substring matches');
select extensions.is((select provider_id from public.search_local_starter_tracks('Target Artist','artist_name') limit 1), 'ranked-search-starter-30', 'Starter artist branch orders independently');
select extensions.is((select count(*) from public.search_local_starter_tracks('Target hidden','title')), 0::bigint, 'inactive Starter picks remain invisible');
reset role;
create policy ranked_search_hidden_entities on public.entities as restrictive for select to anon using(false);
set local role anon;
select extensions.is((select count(*) from public.search_local_entities('target','track','title')), 0::bigint, 'invoker function preserves restrictive RLS');
reset role;
set local role authenticated;
select extensions.is((select provider_id from public.search_local_entities('target','track','title') limit 1), 'ranked-search-30', 'authenticated uses the same public ordering');
reset role;
select * from extensions.finish();
rollback;
