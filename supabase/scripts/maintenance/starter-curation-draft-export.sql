-- Starter curation draft export.
--
-- Run from the Supabase SQL editor, then copy the JSON value from the
-- `starter_curation_export` column into:
--
-- tmp/starter-curation-export.json
--
-- This script is read-only. It exports active starter picks that still need
-- prompt, editorial note, era, format, or broader taste signal coverage.

with available_tags as (
  select
    pt.kind,
    jsonb_agg(
      jsonb_build_object(
        'id', pt.id,
        'slug', pt.slug,
        'label', pt.label,
        'description', pt.description
      )
      order by pt.sort_order, pt.label
    ) as tags
  from public.preference_tags pt
  where pt.kind in ('mood', 'scene', 'style', 'era', 'format', 'genre')
  group by pt.kind
),
available_tag_map as (
  select jsonb_object_agg(kind, tags order by kind) as tags_by_kind
  from available_tags
),
starter_tag_summary as (
  select
    st.id as starter_track_id,
    count(stt.tag_id) as tag_count,
    count(stt.tag_id) filter (where pt.kind = 'genre') as genre_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'mood') as mood_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'scene') as scene_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'style') as style_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'era') as era_tag_count,
    count(stt.tag_id) filter (where pt.kind = 'format') as format_tag_count,
    jsonb_agg(
      jsonb_build_object(
        'id', pt.id,
        'kind', pt.kind,
        'slug', pt.slug,
        'label', pt.label
      )
      order by pt.kind, pt.sort_order, pt.label
    ) filter (where pt.id is not null) as current_tags
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
    st.provider,
    st.provider_id,
    st.type,
    st.title,
    st.artist_name,
    st.cover_url,
    st.deezer_url,
    st.prompt,
    st.editorial_note,
    st.is_featured,
    st.sort_order,
    st.updated_at,
    coalesce(sts.tag_count, 0) as tag_count,
    coalesce(sts.genre_tag_count, 0) as genre_tag_count,
    coalesce(sts.mood_tag_count, 0) as mood_tag_count,
    coalesce(sts.scene_tag_count, 0) as scene_tag_count,
    coalesce(sts.style_tag_count, 0) as style_tag_count,
    coalesce(sts.era_tag_count, 0) as era_tag_count,
    coalesce(sts.format_tag_count, 0) as format_tag_count,
    coalesce(sts.current_tags, '[]'::jsonb) as current_tags
  from public.starter_tracks st
  left join starter_tag_summary sts
    on sts.starter_track_id = st.id
  where st.is_active
),
tracks_needing_curation as (
  select
    starter_readiness.*,
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
    ], null) as missing_signals
  from starter_readiness
  where nullif(btrim(coalesce(prompt, '')), '') is null
    or nullif(btrim(coalesce(editorial_note, '')), '') is null
    or tag_count = 0
    or era_tag_count = 0
    or format_tag_count = 0
    or (
      genre_tag_count = 0
      and mood_tag_count = 0
      and scene_tag_count = 0
      and style_tag_count = 0
    )
)
select jsonb_pretty(
  jsonb_build_object(
    'generatedAt', now(),
    'source', 'starter-curation-draft-export.sql',
    'rules', jsonb_build_array(
      'Do not auto-apply genre suggestions; genre is controlled taxonomy.',
      'Use only existing tag slugs from availableTags.',
      'Prefer editorial prompts, notes, moods, scenes, styles, eras, and formats for assisted drafting.',
      'Keep copy short, music-native, and Kocteau editorial.'
    ),
    'availableTags', coalesce((select tags_by_kind from available_tag_map), '{}'::jsonb),
    'tracks', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'starterTrackId', id,
            'provider', provider,
            'providerId', provider_id,
            'type', type,
            'title', title,
            'artistName', artist_name,
            'coverUrl', cover_url,
            'deezerUrl', deezer_url,
            'currentPrompt', prompt,
            'currentEditorialNote', editorial_note,
            'currentTags', current_tags,
            'missingSignals', missing_signals,
            'isFeatured', is_featured,
            'sortOrder', sort_order,
            'updatedAt', updated_at
          )
          order by array_length(missing_signals, 1) desc nulls last, updated_at desc, title
        )
        from tracks_needing_curation
      ),
      '[]'::jsonb
    )
  )
) as starter_curation_export;
