-- Disposable local database only. Synthetic rows and DDL are rolled back.
begin;
set local statement_timeout='60s';
create function pg_temp.capture_plan(q text) returns jsonb language plpgsql as $$
declare result jsonb;
begin execute 'explain (analyze,buffers,timing off,format json) ' || q into result; return result; end $$;
insert into public.entities (id, provider_id, type, title, artist_name)
select ('b1' || lpad(to_hex(n),6,'0') || '-1111-4000-8000-000000000001')::uuid,
 'ranked-search-growth-'||n,'track',
 case when n=10001 then 'Needle' when n%100=0 then 'Contains Needle '||n else 'Other '||n end,
 'Growth Artist '||(n%50)
from generate_series(1,10001)n;
analyze public.entities;
set local statement_timeout='4s';
set local role anon;
select jsonb_build_object('variant','baseline','trial',trial,'plan',pg_temp.capture_plan(
 'select id,provider,provider_id,type,title,artist_name,cover_url,deezer_url,release_date,record_type,disambiguation,first_release_date,genres from public.entities where provider=''deezer'' and type=''track'' and title ilike ''%needle%'' limit 18'))
from generate_series(1,7)trial;
select jsonb_build_object('variant','ranked-rpc','trial',trial,'plan',pg_temp.capture_plan(
 'select * from public.search_local_entities(''needle'',''track'',''title'',18)'))
from generate_series(1,7)trial;
select jsonb_build_object(
 'fixture_entities',10001,
 'matches',(select count(*) from public.entities where title ilike '%needle%'),
 'baseline_rows',(select count(*) from (select id from public.entities where provider='deezer' and type='track' and title ilike '%needle%' limit 18)s),
 'baseline_exact',(select count(*) from (select title from public.entities where provider='deezer' and type='track' and title ilike '%needle%' limit 18)s where title ilike 'needle'),
 'ranked_rows',(select count(*) from public.search_local_entities('needle','track','title',18)),
 'ranked_exact',(select count(*) from public.search_local_entities('needle','track','title',18) where title ilike 'needle')
);
reset role;
rollback;
