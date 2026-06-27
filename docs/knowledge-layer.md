# Kocteau Knowledge Layer And Atlas

[Docs index](./README.md) | [Discovery and curation](./discovery-curation.md) | [Public backlog](./backlog.md)

Kocteau should not feel like another recommendation engine. The product promise is:

```text
Kocteau does not recommend music. Kocteau teaches people how to discover it.
```

The Knowledge Layer is the system that makes that promise real. It separates music facts from editorial judgment, gives Eve evidence to explain discovery paths, and gives Atlas enough structure to feel like exploration rather than a static wiki.

## Product Boundaries

Use these names as working architecture, not necessarily user-facing labels:

| Layer | Role |
| --- | --- |
| Kocteau | Public music review, discovery, and taste expression product. |
| Atlas | Public exploration surface for genres, moods, scenes, artists, tracks, and routes. |
| Eve | Discovery director that turns structured evidence into human paths. |
| Studio | Maintainer-facing curation desk for starter picks, tags, candidates, and review queues. |
| Kura | Internal operating-system idea for curation. Do not expose this name until it earns product clarity. |

Atlas is not a wiki. A wiki answers "what is this?" Atlas asks "how do you want to explore?"

## Canonical Facts vs Editorial Knowledge

Do not treat every label as a tag with the same authority. Kocteau needs two different classes of knowledge.

### Canonical Facts

Canonical facts are externally verifiable or metadata-derived:

- genre
- release date and era
- country or region
- label
- artist membership
- duration
- provider IDs
- official aliases

These do not need taste approval to exist, but they do need source quality and deduplication.

### Editorial Knowledge

Editorial knowledge is where Kocteau becomes its own product:

- mood
- style
- scene framing
- gateway artist
- deep cut
- stranger path
- beginner-friendly route
- late-night context
- rainy-room context
- why a pick belongs here

These are not objective music facts. They should come from Kocteau curation, reviews, starter picks, trusted community behavior, or Eve drafts that a human can inspect.

## Source Policy

No single source should own Kocteau's music knowledge.

```text
MusicBrainz \
Deezer      \
Discogs      -> Canonical Entity -> Kocteau Knowledge Layer
Wikidata    /
Kocteau    /
```

Use sources by strength:

| Source | Good for | Avoid relying on it for |
| --- | --- | --- |
| MusicBrainz | canonical entities, releases, credits, aliases, broad tags | mood, popularity, visual identity |
| Deezer | playable catalog, covers, track search, artist/album context | final taste meaning |
| Discogs | styles, labels, release culture, physical/catalog context | user-facing recommendations by itself |
| Wikidata | countries, dates, aliases, broad relationships | nuanced music taste |
| Kocteau | reviews, starter picks, human signals, editorial routes | raw catalog completeness |

The product rule is:

```text
External sources identify and enrich. Kocteau explains and routes.
```

## Current Taste Vocabulary

The current `preference_tags` table remains the product-facing vocabulary for now. Treat it as a bridge toward the Knowledge Layer.

| Kind | Meaning | Rule |
| --- | --- | --- |
| `genre` | Broad canonical music category | Should come from external consensus or strong music taxonomy. |
| `mood` | Listener feeling | Editorial Kocteau language. |
| `scene` | Cultural, geographic, temporal, or community context | Editorial or researched context. |
| `style` | Production, texture, arrangement, or sonic language | Editorial descriptor, not a genre dump. |
| `era` | Release period or temporal route | Prefer metadata-derived decade tags. |
| `format` | Release/listening context | Prefer metadata-derived or curator-confirmed values. |

Examples:

- `Dream pop` belongs in `genre`.
- `Dreamy` belongs in `mood`.
- `Jangle pop` belongs in `genre`.
- `Wavy synths` belongs in `style`.
- `Spanish New Wave` belongs in `scene`.
- `Deep cuts` belongs in `format`.

## Discovery Intent

Eve should not start from "what should I recommend?" It should start from:

```text
How does this listener want to explore?
```

V0 intent lanes:

| Intent | User-facing language | Job |
| --- | --- | --- |
| Continue | Continue | Find the closest natural next listen. |
| Go deeper | Go deeper | Move into less obvious but still connected material. |
| Stranger path | Take a stranger path | Preserve a thread while increasing surprise. |
| Travel back | Travel back | Move to older influence, era, or scene context. |
| Travel forward | Travel forward | Move toward descendants, newer scenes, or modern echoes. |
| Story | Why it matters | Explain context without becoming a long essay. |

These lanes should feel like editorial decisions, not algorithm labels.

## Atlas V0

Atlas should begin as public, indexable exploration pages powered by existing data:

- tag pages such as `/atlas/dream-pop`
- mood pages such as `/atlas/nocturnal`
- scene pages such as `/atlas/spanish-new-wave`
- future artist and route pages when entity depth is ready

Each Atlas page should eventually show:

- a short definition
- starter picks
- reviewed tracks
- nearby tags
- Eve route lanes
- human reviews that explain the sound

Do not build a large generic encyclopedia first. Start with the pages that help a listener find what to hear next.

Current phase 1 implementation:

- `/atlas` lists the current `preference_tags` vocabulary by kind.
- `/atlas/[slug]` explains one signal, links nearby signals, and shows active starter picks attached through `starter_track_tags`.
- The surface is intentionally read-only and powered by existing public tables.
- Eve route language appears as directional lanes, but there is no AI generation or graph engine in this phase.

## Eve Contract

Eve is a discovery director, not a generic chat assistant.

Eve may:

- infer likely discovery intent from surface context
- draft editorial tags for curator review
- propose route lanes from structured evidence
- explain why two entities are connected
- identify missing tags or relationships

Eve must not:

- invent genres as facts
- publish production metadata without review
- hide the basis of a recommendation
- act like a final music authority
- replace reviews or human taste

Every user-facing Eve route should be explainable from at least one of:

- shared tags
- starter curation
- reviews
- saved/library signals
- external metadata
- curator-approved relationships

## Data Direction

The future model should move toward explicit entities and relationships:

```text
Entity
  Artist
  Album
  Track
  Genre
  Mood
  Style
  Scene
  Era
  Format
  Label

Relationship
  belongs_to
  influenced_by
  sounds_like
  gateway_to
  opposite_of
  emerged_from
  evolved_into
```

Do not introduce a graph engine yet. The first version can live in Postgres with typed relationship tables, readable SQL, and clear evidence fields.

## Immediate Cleanup

The first cleanup pass should:

- move `dreamy` from `genre` to `mood`
- move `ambient-techno`, `jangle-pop`, and `intelligent-dance-music-idm` into `genre`
- merge old era aliases such as `seventies` into `1970s`
- merge `live-sessions` into `live-recordings`
- keep existing starter, entity, and user tag relations intact

This keeps today's product working while making the next public Atlas/Eve work less messy.

After applying the cleanup migration, run:

```sql
-- supabase/scripts/maintenance/knowledge-layer-tag-cleanup-check.sql
```

Every returned row should have `ok = true`.
