begin;

create function public.get_entity_review_summary(p_entity_id uuid)
returns table (review_count bigint, average_rating numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*), avg(r.rating)
  from public.reviews r
  where r.entity_id = p_entity_id;
$$;

revoke all on function public.get_entity_review_summary(uuid) from public;
grant execute on function public.get_entity_review_summary(uuid) to anon, authenticated;

commit;
