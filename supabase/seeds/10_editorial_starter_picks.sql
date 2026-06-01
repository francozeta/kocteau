WITH collection AS (
  INSERT INTO public.editorial_collections (
    slug,
    title,
    description,
    curation_note,
    is_published,
    sort_order,
    updated_at
  )
  VALUES (
    'starter-picks',
    'Starter picks',
    'A compact set of records to help new listeners start reviewing.',
    'Local development seed content. Curated prompts only; no fake reviews.',
    true,
    0,
    now()
  )
  ON CONFLICT (slug)
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    curation_note = EXCLUDED.curation_note,
    is_published = true,
    sort_order = EXCLUDED.sort_order,
    updated_at = now()
  RETURNING id
),
tracks AS (
  INSERT INTO public.starter_tracks (
    provider,
    provider_id,
    type,
    title,
    artist_name,
    cover_url,
    deezer_url,
    prompt,
    editorial_note,
    is_active,
    is_featured,
    sort_order,
    updated_at
  )
  VALUES
    ('deezer', '942505', 'track', 'Heaven or Las Vegas', 'Cocteau Twins', 'https://cdn-images.dzcdn.net/images/cover/be62b1479e0baf17d8f9beca911ee8cd/250x250-000000-80-0-0.jpg', 'https://www.deezer.com/track/942505', 'What makes this still feel weightless?', 'A dream-pop north star for testing the taste graph.', true, true, 10, now()),
    ('deezer', '80546728', 'track', 'Archangel', 'Burial', 'https://cdn-images.dzcdn.net/images/cover/5dddd046babf2400103929d94ffca87a/250x250-000000-80-0-0.jpg', 'https://www.deezer.com/track/80546728', 'Where does the emotion sit: voice, rhythm, or static?', 'Nocturnal electronic music with a deeply human center.', true, true, 20, now()),
    ('deezer', '662817392', 'track', 'cellophane', 'FKA twigs', 'https://cdn-images.dzcdn.net/images/cover/26a1dcfec5a48b99c315f157a99c59fb/250x250-000000-80-0-0.jpg', 'https://www.deezer.com/track/662817392', 'How much space can one performance hold?', 'A spare vocal performance for testing intimate reviews.', true, false, 30, now()),
    ('deezer', '1685337377', 'track', 'SAOKO', 'Rosalia', 'https://cdn-images.dzcdn.net/images/cover/66ae12120936d9660d3e30a7db7627b8/250x250-000000-80-0-0.jpg', 'https://www.deezer.com/track/1685337377', 'Does its restlessness feel playful or confrontational?', 'A sharp art-pop pivot with rhythmic bite.', true, false, 40, now()),
    ('deezer', '138546809', 'track', 'Weird Fishes / Arpeggi', 'Radiohead', 'https://cdn-images.dzcdn.net/images/cover/a175af9b7d329bc678cb4d26fc13d6de/250x250-000000-80-0-0.jpg', 'https://www.deezer.com/track/138546809', 'What keeps the song moving even when it feels suspended?', 'A familiar entry point for mood and texture tags.', true, false, 50, now()),
    ('deezer', '982668', 'track', 'Roads', 'Portishead', 'https://cdn-images.dzcdn.net/images/cover/5942b88996f33c82790023d5d99395d3/250x250-000000-80-0-0.jpg', 'https://www.deezer.com/track/982668', 'What does restraint do for the song?', 'A quiet anchor for trip-hop and melancholic taste.', true, false, 60, now())
  ON CONFLICT (provider, provider_id, type)
  DO UPDATE SET
    title = EXCLUDED.title,
    artist_name = EXCLUDED.artist_name,
    cover_url = EXCLUDED.cover_url,
    deezer_url = EXCLUDED.deezer_url,
    prompt = EXCLUDED.prompt,
    editorial_note = EXCLUDED.editorial_note,
    is_active = EXCLUDED.is_active,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order,
    updated_at = now()
  RETURNING id, provider_id
),
collection_items AS (
  INSERT INTO public.editorial_collection_items (
    collection_id,
    starter_track_id,
    position,
    note
  )
  SELECT
    collection.id,
    tracks.id,
    CASE tracks.provider_id
      WHEN '942505' THEN 10
      WHEN '80546728' THEN 20
      WHEN '662817392' THEN 30
      WHEN '1685337377' THEN 40
      WHEN '138546809' THEN 50
      WHEN '982668' THEN 60
      ELSE 100
    END,
    NULL
  FROM collection
  CROSS JOIN tracks
  ON CONFLICT (collection_id, starter_track_id)
  DO UPDATE SET
    position = EXCLUDED.position,
    note = EXCLUDED.note
  RETURNING starter_track_id
),
tag_pairs AS (
  SELECT '942505' AS provider_id, unnest(ARRAY['dream-pop', 'euphoric', 'textural']) AS slug
  UNION ALL SELECT '80546728', unnest(ARRAY['electronic', 'nocturnal', 'uk-underground'])
  UNION ALL SELECT '662817392', unnest(ARRAY['art-pop', 'intimate', 'melancholic'])
  UNION ALL SELECT '1685337377', unnest(ARRAY['art-pop', 'electronic', 'euphoric'])
  UNION ALL SELECT '138546809', unnest(ARRAY['indie-rock', 'melancholic', 'textural'])
  UNION ALL SELECT '982668', unnest(ARRAY['trip-hop', 'nocturnal', 'melancholic'])
)
INSERT INTO public.starter_track_tags (
  starter_track_id,
  tag_id,
  weight
)
SELECT
  tracks.id,
  preference_tags.id,
  CASE preference_tags.kind
    WHEN 'genre' THEN 1.45
    WHEN 'mood' THEN 1.25
    ELSE 1
  END
FROM tracks
JOIN tag_pairs ON tag_pairs.provider_id = tracks.provider_id
JOIN public.preference_tags ON preference_tags.slug = tag_pairs.slug
ON CONFLICT (starter_track_id, tag_id)
DO UPDATE SET
  weight = EXCLUDED.weight;
