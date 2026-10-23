begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(16);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('80000000-0000-4000-8000-000000000001','authenticated','authenticated','bundle-a@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('80000000-0000-4000-8000-000000000002','authenticated','authenticated','bundle-b@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());
insert into public.profiles(id,username,onboarded,taste_onboarded)
values
('80000000-0000-4000-8000-000000000001','bundle_fixture_a',true,true),
('80000000-0000-4000-8000-000000000002','bundle_fixture_b',true,true);
insert into public.entities(id,provider,provider_id,type,title)
values ('80000000-0000-4000-8000-000000000010','deezer','850000000','track','Bundle fixture');
insert into public.reviews(id,author_id,entity_id,rating,title,body)
values
('81000001-0000-4000-8000-000000000101','80000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000010',4,null,null),
('81000002-0000-4000-8000-000000000102','80000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000010',4,'Bundle peer','A local fixture.');
insert into public.entities(provider,provider_id,type,title)
select 'deezer',(850000000+n)::text,'track','Bound fixture '||n from generate_series(1,40) n;
insert into public.reviews(author_id,entity_id,rating,title,body,created_at)
select '80000000-0000-4000-8000-000000000002',e.id,4,'Bound fixture','A local fixture.',now()-interval '1 day'
from public.entities e where e.provider='deezer' and e.provider_id::text between '850000001' and '850000040';
insert into public.review_likes(user_id,review_id)
values ('80000000-0000-4000-8000-000000000001','81000002-0000-4000-8000-000000000102');
insert into public.review_bookmarks(user_id,review_id)
values ('80000000-0000-4000-8000-000000000001','81000002-0000-4000-8000-000000000102');

select extensions.has_function('public','get_recommended_feed_bundle',array['integer','numeric','timestamp with time zone','uuid'],'bundle RPC exists');
select extensions.ok(not has_function_privilege('anon','public.get_recommended_feed_bundle(integer,numeric,timestamp with time zone,uuid)','execute'),'anonymous callers cannot read personalized bundles');
select extensions.ok(has_function_privilege('authenticated','public.get_recommended_feed_bundle(integer,numeric,timestamp with time zone,uuid)','execute'),'authenticated callers can read bundles');
select extensions.ok(not has_function_privilege('service_role','public.get_recommended_feed_bundle(integer,numeric,timestamp with time zone,uuid)','execute'),'bundle is not an administrative impersonation API');
select extensions.is((select prosecdef from pg_proc where oid='public.get_recommended_feed_bundle(integer,numeric,timestamp with time zone,uuid)'::regprocedure),false,'bundle preserves invoker RLS');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"80000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select extensions.is((select viewer_has_liked from public.get_recommended_feed_bundle(30) where id='81000002-0000-4000-8000-000000000102'),true,'viewer A sees their like');
select extensions.is((select viewer_has_bookmarked from public.get_recommended_feed_bundle(30) where id='81000002-0000-4000-8000-000000000102'),true,'viewer A sees their bookmark');
select extensions.is((select liked from public.get_viewer_review_collection_state(array['81000001-0000-4000-8000-000000000101','81000002-0000-4000-8000-000000000102']::uuid[]) where review_id='81000001-0000-4000-8000-000000000101'),false,'one like does not select unrelated cards');
select extensions.is((select bookmarked from public.get_viewer_review_collection_state(array['81000001-0000-4000-8000-000000000101','81000002-0000-4000-8000-000000000102']::uuid[]) where review_id='81000001-0000-4000-8000-000000000101'),false,'one bookmark does not select unrelated cards');
select extensions.is((select liked and bookmarked from public.get_viewer_review_collection_state(array['81000002-0000-4000-8000-000000000102']::uuid[])),true,'the selected card retains both interactions');
select set_config('request.jwt.claims','{"sub":"80000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select extensions.is((select viewer_has_liked from public.get_recommended_feed_bundle(30) where id='81000002-0000-4000-8000-000000000102'),false,'viewer B does not inherit A like');
select extensions.is((select viewer_has_bookmarked from public.get_recommended_feed_bundle(30) where id='81000002-0000-4000-8000-000000000102'),false,'viewer B does not inherit A bookmark');
select set_config('request.jwt.claims','{"sub":"80000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select extensions.is((select id from public.get_recommended_feed_bundle(8) limit 1),'81000001-0000-4000-8000-000000000101'::uuid,'first page preserves own-review priority');
select extensions.ok((select title is null and body is null from public.get_recommended_feed_bundle(8) where id='81000001-0000-4000-8000-000000000101'),'rating-only review remains nullable');
select extensions.ok((select count(*)<=33 from public.get_recommended_feed_bundle(100000)),'large limits cannot create unbounded hydration');
select extensions.ok((select count(*)<=4 from public.get_recommended_feed_bundle(-10)),'negative limits remain bounded');
reset role;
select * from extensions.finish();
rollback;
