begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(14);
update public.starter_tracks set is_active=false;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'authenticated','authenticated',email,now(),'{}','{}',now(),now()
from(values('61000000-0000-4000-8000-000000000001'::uuid,'starter-plan-a@example.invalid'),('61000000-0000-4000-8000-000000000002'::uuid,'starter-plan-b@example.invalid'))v(id,email);
insert into public.profiles(id,username,onboarded,taste_onboarded)
values('61000000-0000-4000-8000-000000000001','starter_plan_a',true,true),('61000000-0000-4000-8000-000000000002','starter_plan_b',true,true);
insert into public.preference_tags(id,kind,slug,label)
select md5('starter-bench-tag:'||g)::uuid,'genre','starter-bench-tag-'||g,'Starter bench tag '||g from generate_series(1,8)g;
insert into public.user_preference_tags(user_id,tag_id,weight,source)
select '61000000-0000-4000-8000-000000000001',md5('starter-bench-tag:'||g)::uuid,0.5+g::numeric/10,'onboarding' from generate_series(1,8)g;
insert into public.user_preference_tags(user_id,tag_id,weight,source)
values('61000000-0000-4000-8000-000000000001',md5('starter-bench-tag:1')::uuid,0.4,'inferred');
insert into public.starter_tracks(id,provider_id,title,artist_name,cover_url,prompt,editorial_note,is_active,is_featured,sort_order,created_at)
select md5('starter-bench-track:'||g)::uuid,'starter-bench-track-'||g,'Starter bench track '||g,'Local fixture artist '||(g%80),
'https://example.invalid/'||repeat('cover-',15)||g,repeat('Local prompt. ',8),repeat('Local editorial note. ',12),true,g%7=0,g,
'2026-10-01'::timestamptz+g*interval '1 second' from generate_series(1,24)g;
insert into public.starter_track_tags(starter_track_id,tag_id,weight)
select md5('starter-bench-track:'||g)::uuid,md5('starter-bench-tag:'||t)::uuid,0.5+(t%3)::numeric/4
from generate_series(1,24)g cross join generate_series(1,6)t;
insert into public.editorial_collections(id,slug,title,is_published,sort_order)
select md5('starter-bench-collection:'||g)::uuid,'starter-bench-collection-'||g,'Local fixture collection '||g,g<3,g
from generate_series(1,3)g;
insert into public.editorial_collection_items(collection_id,starter_track_id,position)
select md5('starter-bench-collection:'||c)::uuid,md5('starter-bench-track:'||g)::uuid,g
from generate_series(1,24)g cross join generate_series(1,3)c;
insert into public.starter_sources(id,provider,provider_source_id,title,url,is_active)
values(md5('starter-bench-source')::uuid,'apple_music','starter-bench-source','Local fixture source','https://example.invalid/local-source',true);
insert into public.starter_source_items(source_id,source_item_id,source_position,title,starter_track_id,status,last_seen_at)
select md5('starter-bench-source')::uuid,'local-source-'||g,g,'Local source item '||g,md5('starter-bench-track:'||g)::uuid,
'synced','2026-10-01' from generate_series(1,(24*0.7)::integer)g;
insert into public.entities(id,type,provider,provider_id,title)
values(md5('starter-bench-entity:1')::uuid,'track','deezer','starter-bench-track-1','Starter bench track 1');
insert into public.reviews(id,author_id,entity_id,rating,body)
values(md5('starter-bench-review:1')::uuid,'61000000-0000-4000-8000-000000000001',md5('starter-bench-entity:1')::uuid,4,'Local benchmark review');
analyze public.starter_tracks;
analyze public.starter_track_tags;
analyze public.editorial_collection_items;
analyze public.editorial_collections;
analyze public.starter_source_items;
analyze public.starter_sources;
analyze public.user_preference_tags;

select set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.get_starter_tracks_for_surface(99)),12,'page size is capped at twelve');
select extensions.is((select count(*)::integer from public.get_starter_tracks_for_surface(0)),1,'zero limit still returns one card');
select extensions.is((select count(*)::integer from public.get_starter_tracks_for_surface(null)),6,'null limit uses the six-card default');
select extensions.is((select count(*)::integer from public.get_starter_tracks_for_surface(12,'home','home',
array(select 'starter-bench-track-'||g from generate_series(1,24)g))),0,'all provider exclusions are respected');
select extensions.is((select count(*)::integer from public.get_starter_tracks_for_surface(12,'home','home',
array(select 'starter-bench-track-'||g from generate_series(2,24)g))),0,'caller reviewed track is excluded');
select extensions.ok((select bool_and(to_jsonb(f) @> jsonb_build_object(
'provider',st.provider,'provider_id',st.provider_id,'type',st.type,'title',st.title,'artist_name',st.artist_name,
'cover_url',st.cover_url,'deezer_url',st.deezer_url,'prompt',st.prompt,'editorial_note',st.editorial_note))
from public.get_starter_tracks_for_surface(12) f join public.starter_tracks st on st.id=f.id),
'late hydration retains every public content field for its selected track');
select extensions.ok((select bool_and(collection_slug='starter-bench-collection-1' and collection_title='Local fixture collection 1')
from public.get_starter_tracks_for_surface(12)),'first published collection metadata is preserved');
select extensions.ok((select bool_and(matched_tag_count=6) from public.get_starter_tracks_for_surface(12)),
'duplicate preference sources do not duplicate matched tag count');
select extensions.is((select count(distinct id)::integer from public.get_starter_tracks_for_surface(12)),12,
'source and personalized lanes return unique tracks');
select extensions.results_eq(
'select to_jsonb(f) from public.get_starter_tracks_for_surface(12,''track'',''stable-context'') f',
'select to_jsonb(f) from public.get_starter_tracks_for_surface(12,''track'',''stable-context'') f',
'fixed viewer surface and context keep complete ordered responses deterministic');
reset role;
select set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.get_starter_tracks_for_surface(12,'home','home',
array(select 'starter-bench-track-'||g from generate_series(2,24)g))),1,'another caller can receive the reviewed track');
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role authenticated;
select extensions.ok((select bool_and(matched_tag_count=0) from public.get_starter_tracks_for_surface(12)),
'absent caller ID cannot inherit another callers taste');
reset role;
select extensions.ok(has_function_privilege('authenticated','public.get_starter_tracks_for_surface(integer,text,text,text[])','execute')
and not has_function_privilege('anon','public.get_starter_tracks_for_surface(integer,text,text,text[])','execute'),
'local migration chain retains existing execute grants');
select extensions.ok((select prosecdef and proconfig=array['search_path=""'] from pg_proc
where oid='public.get_starter_tracks_for_surface(integer,text,text,text[])'::regprocedure),
'existing definer boundary keeps its empty search path');
select * from extensions.finish();
rollback;
