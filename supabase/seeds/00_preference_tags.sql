INSERT INTO public.preference_tags (
  kind,
  slug,
  label,
  description,
  is_featured,
  sort_order
)
VALUES
  ('genre', 'dream-pop', 'Dream pop', 'Weightless guitars, blurred edges, and melodic drift.', true, 10),
  ('genre', 'trip-hop', 'Trip hop', 'Downtempo breakbeats, smoky rooms, and late-night tension.', true, 20),
  ('genre', 'art-pop', 'Art pop', 'Pop forms bent by texture, performance, and left turns.', true, 30),
  ('genre', 'electronic', 'Electronic', 'Synthetic rhythm, atmosphere, and club-adjacent detail.', true, 40),
  ('genre', 'indie-rock', 'Indie rock', 'Guitars, intimate scale, and a writerly center.', true, 50),
  ('mood', 'melancholic', 'Melancholic', 'For songs that sit with longing instead of rushing past it.', true, 110),
  ('mood', 'nocturnal', 'Nocturnal', 'Late-night records with shadow, space, and pulse.', true, 120),
  ('mood', 'euphoric', 'Euphoric', 'Songs that lift without turning loud for its own sake.', true, 130),
  ('mood', 'intimate', 'Intimate', 'Close-mic detail, private-room writing, and vulnerable delivery.', true, 140),
  ('scene', 'uk-underground', 'UK underground', 'Club mutations, pirate-radio memory, and bass pressure.', true, 210),
  ('style', 'textural', 'Textural', 'Records where surface, grain, and atmosphere carry meaning.', true, 310),
  ('era', '1990s', '1990s', 'A loose marker for the decade rather than nostalgia as a genre.', true, 410)
ON CONFLICT (slug)
DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;
