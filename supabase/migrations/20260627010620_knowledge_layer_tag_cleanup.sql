-- Kocteau Knowledge Layer tag cleanup.
--
-- This migration keeps `preference_tags` as the current product-facing taste
-- vocabulary while cleaning obvious taxonomy drift:
-- - canonical facts stay as genres, eras, and formats
-- - editorial descriptors stay as moods, scenes, and styles
-- - duplicate era/format aliases are merged without losing existing relations

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

CREATE OR REPLACE FUNCTION pg_temp.merge_preference_tag(
  p_from_slug text,
  p_to_slug text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_from_id uuid;
  v_to_id uuid;
BEGIN
  SELECT id INTO v_from_id
  FROM public.preference_tags
  WHERE slug = p_from_slug
  FOR UPDATE;

  SELECT id INTO v_to_id
  FROM public.preference_tags
  WHERE slug = p_to_slug
  FOR UPDATE;

  IF v_from_id IS NULL OR v_to_id IS NULL OR v_from_id = v_to_id THEN
    RETURN;
  END IF;

  INSERT INTO public.starter_track_tags (
    starter_track_id,
    tag_id,
    weight,
    created_at
  )
  SELECT
    starter_track_id,
    v_to_id,
    weight,
    created_at
  FROM public.starter_track_tags
  WHERE tag_id = v_from_id
  ON CONFLICT (starter_track_id, tag_id)
  DO UPDATE SET
    weight = greatest(public.starter_track_tags.weight, EXCLUDED.weight);

  DELETE FROM public.starter_track_tags
  WHERE tag_id = v_from_id;

  INSERT INTO public.entity_preference_tags (
    entity_id,
    tag_id,
    source,
    weight,
    created_at,
    updated_at
  )
  SELECT
    entity_id,
    v_to_id,
    source,
    weight,
    created_at,
    updated_at
  FROM public.entity_preference_tags
  WHERE tag_id = v_from_id
  ON CONFLICT (entity_id, tag_id)
  DO UPDATE SET
    source = CASE
      WHEN public.entity_preference_tags.source = 'manual'
        THEN public.entity_preference_tags.source
      ELSE EXCLUDED.source
    END,
    weight = greatest(public.entity_preference_tags.weight, EXCLUDED.weight),
    updated_at = greatest(public.entity_preference_tags.updated_at, EXCLUDED.updated_at);

  DELETE FROM public.entity_preference_tags
  WHERE tag_id = v_from_id;

  INSERT INTO public.user_preference_tags (
    user_id,
    tag_id,
    source,
    weight,
    created_at,
    updated_at
  )
  SELECT
    user_id,
    v_to_id,
    source,
    weight,
    created_at,
    updated_at
  FROM public.user_preference_tags
  WHERE tag_id = v_from_id
  ON CONFLICT (user_id, tag_id, source)
  DO UPDATE SET
    weight = greatest(public.user_preference_tags.weight, EXCLUDED.weight),
    updated_at = greatest(public.user_preference_tags.updated_at, EXCLUDED.updated_at);

  DELETE FROM public.user_preference_tags
  WHERE tag_id = v_from_id;

  DELETE FROM public.preference_tags
  WHERE id = v_from_id;
END;
$$;

INSERT INTO public.preference_tags (
  kind,
  slug,
  label,
  description,
  is_featured,
  sort_order
)
VALUES
  -- Canonical genre facts. Genres should map to broad external or consensus
  -- music categories; more subjective texture belongs in mood/style/scene.
  ('genre', 'indie-rock', 'Indie rock', 'Guitar-led independent rock traditions, from college radio to modern indie rooms.', true, 20),
  ('genre', 'shoegaze', 'Shoegaze', 'Dense guitar wash, blurred vocals, and immersive distortion.', true, 30),
  ('genre', 'dream-pop', 'Dream pop', 'Weightless guitars, blurred edges, and melodic drift.', true, 40),
  ('genre', 'post-punk', 'Post-punk', 'Angular basslines, tension, shadow, and art-school aftershocks.', true, 50),
  ('genre', 'electronic', 'Electronic', 'Synthetic rhythm, atmosphere, and club-adjacent detail.', true, 60),
  ('genre', 'ambient', 'Ambient', 'Music built around atmosphere, patience, and spatial attention.', true, 70),
  ('genre', 'ambient-techno', 'Ambient techno', 'Ambient space carried by techno pulse and repetition.', true, 75),
  ('genre', 'hip-hop', 'Hip-hop', 'Rap, beat culture, sampling, and rhythmic vocal form.', true, 80),
  ('genre', 'rnb', 'R&B', 'Rhythm and blues traditions across soul, pop, and modern vocal production.', true, 90),
  ('genre', 'contemporary-r-b', 'Contemporary R&B', 'Modern R&B production, vocal intimacy, and electronic softness.', true, 100),
  ('genre', 'alternative-r-b', 'Alternative R&B', 'R&B forms bent by atmosphere, left turns, and experimental production.', true, 110),
  ('genre', 'lo-fi-r-b', 'Lo-fi R&B', 'R&B intimacy with rougher texture, tape warmth, or bedroom-scale production.', true, 120),
  ('genre', 'bedroom-pop', 'Bedroom pop', 'Home-recorded pop intimacy, soft edges, and small-room scale.', true, 130),
  ('genre', 'alt-pop', 'Alt-pop', 'Pop forms that sit outside a clean mainstream center.', true, 140),
  ('genre', 'experimental-pop', 'Experimental pop', 'Pop writing pushed through unusual structure, texture, or performance.', true, 150),
  ('genre', 'indie-pop', 'Indie pop', 'Melodic independent pop with intimate scale and jangling roots.', true, 160),
  ('genre', 'jangle-pop', 'Jangle pop', 'Bright guitar chime, melodic clarity, and indie-pop lineage.', true, 165),
  ('genre', 'trip-hop', 'Trip hop', 'Downtempo breakbeats, smoky rooms, and late-night tension.', true, 170),
  ('genre', 'art-pop', 'Art pop', 'Pop forms bent by texture, performance, and left turns.', true, 180),
  ('genre', 'intelligent-dance-music-idm', 'Intelligent Dance Music (IDM)', 'Detailed electronic listening music with broken rhythm and cerebral structure.', true, 185),
  ('genre', 'darkwave', 'Darkwave', 'Post-punk shadow, synth atmosphere, and gothic melodic pull.', true, 190),
  ('genre', 'dark-ambient', 'Dark ambient', 'Ambient music built around shadow, dread, and deep-space quiet.', true, 200),
  ('genre', 'latin', 'Latin', 'Broad Latin music umbrella used only when a narrower genre is unavailable.', true, 210),
  ('genre', 'latin-alternative', 'Latin alternative', 'Latin music crossing indie, rock, electronic, and experimental scenes.', true, 220),
  ('genre', 'jazz', 'Jazz', 'Improvisation, swing lineage, harmonic movement, and ensemble language.', false, 300),
  ('genre', 'folk', 'Folk', 'Song traditions, acoustic writing, and vernacular storytelling.', false, 310),
  ('genre', 'metal', 'Metal', 'Heavy guitar music built around distortion, force, and density.', false, 320),
  ('genre', 'punk', 'Punk', 'Urgent guitar music, direct attack, and DIY lineage.', false, 330),
  ('genre', 'reggaeton', 'Reggaeton', 'Dembow rhythm, Latin club movement, and pop crossover force.', false, 340),
  ('genre', 'salsa', 'Salsa', 'Afro-Caribbean dance music with clave, brass, percussion, and vocal call.', false, 350),
  ('genre', 'house', 'House', 'Four-on-the-floor club music rooted in Chicago, disco, and dance culture.', false, 360),
  ('genre', 'techno', 'Techno', 'Electronic dance music built around machine rhythm, repetition, and futurist pressure.', false, 370),
  ('genre', 'classical', 'Classical', 'Western art music traditions, composition, and long-form interpretation.', false, 380),

  -- Editorial knowledge. These do not need external genre authority.
  ('mood', 'intimate', 'Intimate', 'Close-mic detail, private-room writing, and vulnerable delivery.', true, 10),
  ('mood', 'melancholic', 'Melancholic', 'For songs that sit with longing instead of rushing past it.', true, 20),
  ('mood', 'nostalgic', 'Nostalgic', 'Music that looks backward without becoming only retro.', true, 30),
  ('mood', 'dreamy', 'Dreamy', 'Soft-focus, floating, or half-awake feeling.', true, 40),
  ('mood', 'soft', 'Soft', 'Gentle edges, low pressure, and emotional restraint.', true, 50),
  ('mood', 'nocturnal', 'Nocturnal', 'Late-night records with shadow, space, and pulse.', true, 60),
  ('mood', 'danceable', 'Danceable', 'Movement-forward records without requiring peak-time club energy.', true, 70),
  ('mood', 'hypnotic', 'Hypnotic', 'Loops, repetition, or trance-like pull.', true, 75),
  ('mood', 'cathartic', 'Cathartic', 'Songs that release pressure instead of simply sounding sad.', true, 80),
  ('mood', 'cinematic', 'Cinematic', 'Music that frames scenes, rooms, or images in the mind.', false, 85),
  ('mood', 'euphoric', 'Euphoric', 'Songs that lift without turning loud for its own sake.', true, 90),
  ('mood', 'romantic', 'Romantic', 'Open-hearted or longing-centered emotional language.', true, 100),
  ('mood', 'sunny', 'Sunny', 'Warm, bright, and unguarded energy.', false, 140),
  ('mood', 'ritual', 'Ritual', 'Music that feels ceremonial, repetitive, or devotional.', false, 150),
  ('mood', 'chill', 'Chill', 'Relaxed, low-friction listening without losing character.', true, 151),
  ('mood', 'energetic', 'Energetic', 'Forward motion, high pulse, or physical charge.', true, 155),
  ('mood', 'minimal', 'Minimal', 'Reduced elements, negative space, and patient structure.', true, 200),
  ('mood', 'noisy', 'Noisy', 'Distortion, abrasion, or overloaded texture used as expression.', true, 210),
  ('mood', 'chaotic', 'Chaotic', 'Unstable, overloaded, or deliberately disorienting energy.', true, 220),
  ('mood', 'trippy', 'Trippy', 'Psychedelic perception, warped space, or altered-state movement.', true, 440),

  ('scene', 'club', 'Club', 'Dancefloor context, DJ culture, and room-centered energy.', true, 20),
  ('scene', 'sad-dancefloor', 'Sad dancefloor', 'Dance music with melancholy or emotional afterglow.', true, 70),
  ('scene', 'grunge-era', 'Grunge era', 'Early-90s alternative guitar culture and its surrounding mood.', true, 84),
  ('scene', 'bedroom', 'Bedroom', 'Home-recorded scale, private rooms, and DIY intimacy.', true, 110),
  ('scene', 'uk-underground', 'UK underground', 'Club mutations, pirate-radio memory, and bass pressure.', true, 210),
  ('scene', 'internet-pop', 'Internet pop', 'Online-native pop scenes, micro-scenes, and digital circulation.', true, 310),
  ('scene', 'leftfield-latin', 'Leftfield Latin', 'Latin music crossing experimental, underground, or club-adjacent lanes.', true, 340),
  ('scene', 'spanish-new-wave', 'Spanish New Wave', 'Spanish-language new wave, post-punk, synth, and adjacent 80s scenes.', true, 360),
  ('scene', 'madrid-underground', 'Madrid underground', 'Madrid-rooted underground or alternative scenes.', true, 370),
  ('scene', 'crate-digging', 'Crate digging', 'Records that reward catalog digging, sampling memory, or collector routes.', true, 410),
  ('scene', 'underground', 'Underground', 'Music circulating through smaller rooms, scenes, or non-mainstream channels.', true, 420),
  ('scene', 'rainy-room', 'Rainy room', 'Small-room, gray-window atmosphere for slower listening.', true, 430),

  ('style', 'lo-fi', 'Lo-fi', 'Rougher fidelity, tape grain, or imperfect recording texture.', false, 10),
  ('style', 'hi-fi', 'Hi-fi', 'Clean, detailed, and polished sonic presentation.', false, 20),
  ('style', 'sample-based', 'Sample-based', 'Built from sampled fragments, loops, or collage logic.', false, 50),
  ('style', 'instrumental', 'Instrumental', 'Music led without a primary vocal line.', false, 70),
  ('style', 'textural', 'Textural', 'Records where surface, grain, and atmosphere carry meaning.', true, 80),
  ('style', 'haunting-melodies', 'Haunting melodies', 'Melodic lines that linger, unsettle, or feel ghosted.', true, 82),
  ('style', 'cinematic-melancholy', 'Cinematic melancholy', 'Film-like sadness, wide framing, and emotional shadow.', true, 83),
  ('style', 'wavy-synths', 'Wavy synths', 'Synth movement with bend, shimmer, or softened instability.', true, 140),
  ('style', 'synth-heavy', 'Synth heavy', 'Synths as the dominant melodic, harmonic, or atmospheric language.', true, 150),
  ('style', 'guitar-driven', 'Guitar driven', 'Guitars carry the song shape or emotional force.', true, 160),
  ('style', 'bass-heavy', 'Bass heavy', 'Low-end pressure, bass movement, or bassline identity.', true, 170),
  ('style', 'vocal-forward', 'Vocal forward', 'Voice as the clear emotional or structural center.', true, 180),
  ('style', 'tropical', 'Tropical', 'Warm rhythmic color, island-adjacent texture, or humid brightness.', true, 350),

  ('era', 'pre-1970s', 'Pre-1970s', 'Older catalog, standards, early scenes, and records that feel outside the modern cycle.', true, 380),
  ('era', '1970s', '1970s', 'Analog rooms, disco, punk, soul, dub, and early electronic edges.', true, 390),
  ('era', '1980s', '1980s', 'Drum machines, synth gloss, post-punk shadows, and pop becoming cinematic.', true, 400),
  ('era', '1990s', '1990s', 'A loose marker for the decade rather than nostalgia as a genre.', true, 410),
  ('era', '2000s', '2000s', 'Blog-era crossings, indie rooms, club shifts, and early digital texture.', true, 420),
  ('era', '2010s', '2010s', 'Streaming-era scenes, bedroom production, and genre borders getting softer.', true, 430),
  ('era', '2020s', '2020s', 'Recent records shaping the current Kocteau listening shelf.', true, 440),
  ('era', 'current', 'Current', 'New and near-current releases that should stay close to the feed.', true, 450),

  ('format', 'singles', 'Singles', 'One-track statements, hooks, and quick entry points.', true, 500),
  ('format', 'eps', 'EPs', 'Short-form releases with enough shape to show an artist direction.', true, 510),
  ('format', 'album-focused', 'Album-focused', 'Records that make more sense when heard as a full body of work.', true, 520),
  ('format', 'deep-cuts', 'Deep cuts', 'Non-obvious tracks that reward slower listening or catalog digging.', true, 530),
  ('format', 'live-recordings', 'Live recordings', 'Performances where room, crowd, or arrangement changes the record.', true, 540),
  ('format', 'remixes', 'Remixes', 'Alternate versions, club mutations, and reinterpretations.', true, 550),
  ('format', 'b-sides', 'B-sides', 'Loose ends, companion tracks, and hidden catalog corners.', true, 560),
  ('format', 'dj-mixes', 'DJ mixes', 'Selections where sequence and transition carry the listening context.', true, 570)
ON CONFLICT (slug)
DO UPDATE SET
  kind = EXCLUDED.kind,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;

SELECT pg_temp.merge_preference_tag('seventies', '1970s');
SELECT pg_temp.merge_preference_tag('eighties', '1980s');
SELECT pg_temp.merge_preference_tag('nineties', '1990s');
SELECT pg_temp.merge_preference_tag('two-thousands', '2000s');
SELECT pg_temp.merge_preference_tag('twenty-tens', '2010s');
SELECT pg_temp.merge_preference_tag('live-sessions', 'live-recordings');

COMMIT;
