begin;

set local role authenticated;
-- Supply a local fixture identity with psql -v fixture_user_id=... .
select set_config('request.jwt.claim.sub', :'fixture_user_id', true);

select jsonb_agg(
  jsonb_build_object(
    'review_id', recommendation.review_id,
    'score', recommendation.score,
    'reason', recommendation.reason,
    'created_at', recommendation.created_at
  )
  order by recommendation.score desc, recommendation.created_at desc, recommendation.review_id desc
) as recommendations
from public.get_recommended_review_ids(9, null, null, null) recommendation;

rollback;
