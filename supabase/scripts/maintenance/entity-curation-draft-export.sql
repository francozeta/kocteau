-- Entity curation draft export.
--
-- Run from the Supabase SQL editor, then copy the JSON value from the
-- `entity_curation_export` column into:
--
-- tmp/entity-curation-export.json
--
-- This script is read-only. It exports local track entities that have enough
-- Kocteau signal to deserve tag/context drafting, but are missing entity tags.

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
entity_tag_summary as (
  select
    e.id as entity_id,
    count(ept.tag_id) as tag_count,
    count(ept.tag_id) filter (where ept.source = 'manual') as manual_tag_count,
    count(ept.tag_id) filter (where pt.kind = 'genre') as genre_tag_count,
    count(ept.tag_id) filter (where pt.kind = 'mood') as mood_tag_count,
    count(ept.tag_id) filter (where pt.kind = 'scene') as scene_tag_count,
    count(ept.tag_id) filter (where pt.kind = 'style') as style_tag_count,
    count(ept.tag_id) filter (where pt.kind = 'era') as era_tag_count,
    count(ept.tag_id) filter (where pt.kind = 'format') as format_tag_count,
    jsonb_agg(
      jsonb_build_object(
        'id', pt.id,
        'kind', pt.kind,
        'slug', pt.slug,
        'label', pt.label,
        'source', ept.source,
        'weight', ept.weight
      )
      order by pt.kind, pt.sort_order, pt.label
    ) filter (where pt.id is not null) as current_tags
  from public.entities e
  left join public.entity_preference_tags ept
    on ept.entity_id = e.id
  left join public.preference_tags pt
    on pt.id = ept.tag_id
  group by e.id
),
starter_tag_summary as (
  select
    st.provider,
    st.provider_id,
    st.type,
    jsonb_agg(
      jsonb_build_object(
        'kind', pt.kind,
        'slug', pt.slug,
        'label', pt.label
      )
      order by pt.kind, pt.sort_order, pt.label
    ) filter (where pt.id is not null) as starter_tags
  from public.starter_tracks st
  left join public.starter_track_tags stt
    on stt.starter_track_id = st.id
  left join public.preference_tags pt
    on pt.id = stt.tag_id
  where st.is_active
  group by st.provider, st.provider_id, st.type
),
review_stats as (
  select
    r.entity_id,
    count(*) as review_count,
    round(avg(r.rating)::numeric, 2) as average_rating,
    max(r.created_at) as latest_review_at
  from public.reviews r
  group by r.entity_id
),
bookmark_stats as (
  select
    eb.entity_id,
    count(*) as bookmark_count
  from public.entity_bookmarks eb
  group by eb.entity_id
),
library_stats as (
  select
    item.entity_id,
    count(*) as library_count
  from public.entity_library_items item
  where item.item_type = 'library'
  group by item.entity_id
),
entity_readiness as (
  select
    e.id,
    e.provider,
    e.provider_id,
    e.type,
    e.title,
    e.artist_name,
    e.cover_url,
    e.deezer_url,
    e.created_at,
    e.updated_at,
    coalesce(ets.tag_count, 0) as tag_count,
    coalesce(ets.manual_tag_count, 0) as manual_tag_count,
    coalesce(ets.genre_tag_count, 0) as genre_tag_count,
    coalesce(ets.mood_tag_count, 0) as mood_tag_count,
    coalesce(ets.scene_tag_count, 0) as scene_tag_count,
    coalesce(ets.style_tag_count, 0) as style_tag_count,
    coalesce(ets.era_tag_count, 0) as era_tag_count,
    coalesce(ets.format_tag_count, 0) as format_tag_count,
    coalesce(ets.current_tags, '[]'::jsonb) as current_tags,
    coalesce(sts.starter_tags, '[]'::jsonb) as starter_tags,
    coalesce(rs.review_count, 0) as review_count,
    rs.average_rating,
    rs.latest_review_at,
    coalesce(bs.bookmark_count, 0) as bookmark_count,
    coalesce(ls.library_count, 0) as library_count,
    (
      coalesce(rs.review_count, 0) * 3
      + coalesce(ls.library_count, 0) * 2
      + coalesce(bs.bookmark_count, 0)
      + case when sts.starter_tags is not null then 4 else 0 end
      + coalesce(ets.manual_tag_count, 0) * 4
    ) as signal_score,
    (
      coalesce(rs.review_count, 0) > 0
      or coalesce(ls.library_count, 0) > 0
      or coalesce(bs.bookmark_count, 0) > 0
      or sts.starter_tags is not null
      or coalesce(ets.manual_tag_count, 0) > 0
    ) as has_curation_signal
  from public.entities e
  left join entity_tag_summary ets
    on ets.entity_id = e.id
  left join starter_tag_summary sts
    on sts.provider = e.provider
    and sts.provider_id = e.provider_id
    and sts.type = e.type
  left join review_stats rs
    on rs.entity_id = e.id
  left join bookmark_stats bs
    on bs.entity_id = e.id
  left join library_stats ls
    on ls.entity_id = e.id
  where e.type = 'track'
),
entities_needing_curation as (
  select
    entity_readiness.*,
    array_remove(array[
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
  from entity_readiness
  where has_curation_signal
    and (
      tag_count = 0
      or era_tag_count = 0
      or format_tag_count = 0
      or (
        genre_tag_count = 0
        and mood_tag_count = 0
        and scene_tag_count = 0
        and style_tag_count = 0
      )
    )
)
select jsonb_pretty(
  jsonb_build_object(
    'generatedAt', now(),
    'source', 'entity-curation-draft-export.sql',
    'rules', jsonb_build_array(
      'Do not auto-apply genre suggestions; genre remains human-reviewed taxonomy.',
      'Use only existing tag slugs from availableTags.',
      'Prefer tags backed by track identity, community signal, or starter tags.',
      'Do not include private user data, raw review text, emails, IP addresses, or user agents.'
    ),
    'availableTags', coalesce((select tags_by_kind from available_tag_map), '{}'::jsonb),
    'entities', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'entityId', id,
            'provider', provider,
            'providerId', provider_id,
            'type', type,
            'title', title,
            'artistName', artist_name,
            'coverUrl', cover_url,
            'deezerUrl', deezer_url,
            'currentTags', current_tags,
            'starterTags', starter_tags,
            'missingSignals', missing_signals,
            'manualTagCount', manual_tag_count,
            'reviewCount', review_count,
            'averageRating', average_rating,
            'latestReviewAt', latest_review_at,
            'bookmarkCount', bookmark_count,
            'libraryCount', library_count,
            'signalScore', signal_score,
            'createdAt', created_at,
            'updatedAt', updated_at
          )
          order by signal_score desc, updated_at desc, title
        )
        from (
          select *
          from entities_needing_curation
          order by signal_score desc, updated_at desc, title
          limit 60
        ) scoped_entities
      ),
      '[]'::jsonb
    )
  )
) as entity_curation_export;
