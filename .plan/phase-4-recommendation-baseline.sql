begin;

set local role authenticated;
-- Supply a local fixture identity with psql -v fixture_user_id=... .
select set_config('request.jwt.claim.sub', :'fixture_user_id', true);

select count(*)
from public.get_recommended_review_ids(9, null, null, null);

explain (analyze, buffers, format text)
select *
from public.get_recommended_review_ids(9, null, null, null);

rollback;
