-- Starter curation readiness audit.
--
-- Run from the Supabase SQL editor before assisted starter metadata work.
-- This script is read-only: it does not create, update, or delete rows.
--
-- Purpose:
-- - Find starter picks missing review prompts, editorial notes, eras, formats,
--   or broader taste tags.
-- - Keep genre taxonomy human-controlled while letting future assisted tools
--   focus on prompts, notes, moods, scenes, styles, eras, and formats.

-- 1. Aggregate readiness summary.
with starter_tag_summary as (
  select
    st.id as starter_track_id,
    count(stt.tag_id) as tag_count,
    count(stt.tag_id) filter (where pt.kind = 'genre') as genre_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'mood') as mood_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'scene') as scene_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'style') as style_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'era') as era_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'format') as format_tag_count
  from public.starter_tracks st
  left join public.starter_track_tags stt
    on stt.starter_track_id = st.id
  left join public.preference_tags pt
    on pt.id = stt.tag_id
  group by st.id
),
starter_readiness as (
  select
    st.id,
    st.is_active,
    nullif(btrim(coalesce(st.prompt, '')), '') is not null as has_prompt,
    nullif(btrim(coalesce(st.editorial_note, '')), '') is not null as has_editorial_note,
    coalesce(sts.tag_count, 0) as tag_count,
    coalesce(sts.genre_tag_count, 0) as genre_tag_count,
    coalesce(sts.mood_tag_count, 0) as mood_tag_count,
    coalesce(sts.scene_tag_count, 0) as scene_tag_count,
    coalesce(sts.style_tag_count, 0) as style_tag_count,
    coalesce(sts.era_tag_count, 0) as era_tag_count,
    coalesce(sts.format_tag_count, 0) as format_tag_count
  from public.starter_tracks st
  left join starter_tag_summary sts
    on sts.starter_track_id = st.id
)
select
  count(*) as total_starter_tracks,
  count(*) filter (where is_active) as active_starter_tracks,
  count(*) filter (where not is_active) as inactive_starter_tracks,
  count(*) filter (where is_active and has_prompt and has_editorial_note) as active_with_editorial_copy,
  count(*) filter (where is_active and tag_count > 0) as active_with_any_tags,
  count(*) filter (where is_active and era_tag_count > 0) as active_with_era,
  count(*) filter (where is_active and format_tag_count > 0) as active_with_format,
  count(*) filter (
    where is_active
      and has_prompt
      and has_editorial_note
      and tag_count > 0
      and era_tag_count > 0
      and format_tag_count > 0
      and (
        genre_tag_count > 0
        or mood_tag_count > 0
        or scene_tag_count > 0
        or style_tag_count > 0
      )
  ) as active_ready_tracks,
  count(*) filter (
    where is_active
      and (
        not has_prompt
        or not has_editorial_note
        or tag_count = 0
        or era_tag_count = 0
        or format_tag_count = 0
      )
  ) as active_tracks_needing_curation
from starter_readiness;

-- 2. Track-level readiness list.
with starter_tag_summary as (
  select
    st.id as starter_track_id,
    count(stt.tag_id) as tag_count,
    count(stt.tag_id) filter (where pt.kind = 'genre') as genre_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'mood') as mood_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'scene') as scene_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'style') as style_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'era') as era_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'format') as format_tag_count,
    array_remove(array_agg(pt.label order by pt.kind, pt.sort_order, pt.label) filter (where pt.kind = 'genre'), null) as genre_tags,
    array_remove(array_agg(pt.label order by pt.sort_order, pt.label) filter (where pt.kind = 'mood'), null) as mood_tags,
    array_remove(array_agg(pt.label order by pt.sort_order, pt.label) filter (where pt.kind = 'scene'), null) as scene_tags,
    array_remove(array_agg(pt.label order by pt.sort_order, pt.label) filter (where pt.kind = 'style'), null) as style_tags,
    array_remove(array_agg(pt.label order by pt.sort_order, pt.label) filter (where pt.kind = 'era'), null) as era_tags,
    array_remove(array_agg(pt.label order by pt.sort_order, pt.label) filter (where pt.kind = 'format'), null) as format_tags
  from public.starter_tracks st
  left join public.starter_track_tags stt
    on stt.starter_track_id = st.id
  left join public.preference_tags pt
    on pt.id = stt.tag_id
  group by st.id
),
starter_readiness as (
  select
    st.id,
    st.provider_id,
    st.title,
    st.artist_name,
    st.is_active,
    st.is_featured,
    st.prompt,
    st.editorial_note,
    st.created_at,
    st.updated_at,
    coalesce(sts.tag_count, 0) as tag_count,
    coalesce(sts.genre_tag_count, 0) as genre_tag_count,
    coalesce(sts.mood_tag_count, 0) as mood_tag_count,
    coalesce(sts.scene_tag_count, 0) as scene_tag_count,
    coalesce(sts.style_tag_count, 0) as style_tag_count,
    coalesce(sts.era_tag_count, 0) as era_tag_count,
    coalesce(sts.format_tag_count, 0) as format_tag_count,
    coalesce(sts.genre_tags, ARRAY[]::text[]) as genre_tags,
    coalesce(sts.mood_tags, ARRAY[]::text[]) as mood_tags,
    coalesce(sts.scene_tags, ARRAY[]::text[]) as scene_tags,
    coalesce(sts.style_tags, ARRAY[]::text[]) as style_tags,
    coalesce(sts.era_tags, ARRAY[]::text[]) as era_tags,
    coalesce(sts.format_tags, ARRAY[]::text[]) as format_tags
  from public.starter_tracks st
  left join starter_tag_summary sts
    on sts.starter_track_id = st.id
)
select
  case
    when not is_active then 'inactive'
    when nullif(btrim(coalesce(prompt, '')), '') is not null
      and nullif(btrim(coalesce(editorial_note, '')), '') is not null
      and tag_count > 0
      and era_tag_count > 0
      and format_tag_count > 0
      and (
        genre_tag_count > 0
        or mood_tag_count > 0
        or scene_tag_count > 0
        or style_tag_count > 0
      )
      then 'ready'
    when nullif(btrim(coalesce(prompt, '')), '') is null
      or nullif(btrim(coalesce(editorial_note, '')), '') is null
      then 'needs-editorial-copy'
    when tag_count = 0
      or era_tag_count = 0
      or format_tag_count = 0
      then 'needs-taxonomy'
    else 'needs-review'
  end as readiness,
  array_remove(array[
    case when nullif(btrim(coalesce(prompt, '')), '') is null then 'prompt' end,
    case when nullif(btrim(coalesce(editorial_note, '')), '') is null then 'editorial_note' end,
    case when tag_count = 0 then 'any_tag' end,
    case when era_tag_count = 0 then 'era' end,
    case when format_tag_count = 0 then 'format' end,
    case
      when genre_tag_count = 0
        and mood_tag_count = 0
        and scene_tag_count = 0
        and style_tag_count = 0
        then 'genre_mood_scene_or_style'
    end
  ], null) as missing_signals,
  provider_id,
  title,
  artist_name,
  is_active,
  is_featured,
  tag_count,
  genre_tags,
  mood_tags,
  scene_tags,
  style_tags,
  era_tags,
  format_tags,
  prompt,
  editorial_note,
  updated_at
from starter_readiness
order by
  is_active desc,
  readiness,
  array_length(array_remove(array[
    case when nullif(btrim(coalesce(prompt, '')), '') is null then 'prompt' end,
    case when nullif(btrim(coalesce(editorial_note, '')), '') is null then 'editorial_note' end,
    case when tag_count = 0 then 'any_tag' end,
    case when era_tag_count = 0 then 'era' end,
    case when format_tag_count = 0 then 'format' end,
    case
      when genre_tag_count = 0
        and mood_tag_count = 0
        and scene_tag_count = 0
        and style_tag_count = 0
        then 'genre_mood_scene_or_style'
    end
  ], null), 1) desc nulls last,
  updated_at desc,
  title;

-- 3. Tag-kind coverage across active starter picks.
select
  pt.kind,
  count(distinct pt.id) as vocabulary_tags,
  count(distinct stt.tag_id) filter (where st.is_active) as tags_used_by_active_tracks,
  count(distinct stt.starter_track_id) filter (where st.is_active) as active_tracks_with_kind,
  (
    select count(*)
    from public.starter_tracks active_tracks
    where active_tracks.is_active
  ) as active_track_count
from public.preference_tags pt
left join public.starter_track_tags stt
  on stt.tag_id = pt.id
left join public.starter_tracks st
  on st.id = stt.starter_track_id
group by pt.kind
order by pt.kind;

-- 4. Existing vocabulary tags with zero active starter coverage.
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
having count(stt.starter_track_id) filter (where st.is_active) = 0
order by
  pt.kind,
  pt.sort_order,
  pt.label;
