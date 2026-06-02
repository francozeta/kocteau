-- Starter tag coverage by active starter tracks.
--
-- Run from the Supabase SQL editor to find tags that exist in the vocabulary
-- but are not attached to active starter picks yet.

select
  pt.kind,
  pt.label,
  pt.slug,
  count(stt.starter_track_id) as total_starter_track_count,
  count(stt.starter_track_id) filter (where st.is_active) as active_starter_track_count
from public.preference_tags pt
left join public.starter_track_tags stt
  on stt.tag_id = pt.id
left join public.starter_tracks st
  on st.id = stt.starter_track_id
group by
  pt.id,
  pt.kind,
  pt.label,
  pt.slug
order by
  active_starter_track_count asc,
  total_starter_track_count asc,
  pt.kind,
  pt.label;
