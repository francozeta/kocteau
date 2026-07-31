# Kocteau Knowledge Layer And Search

[Docs index](./README.md) | [Discovery and curation](./discovery-curation.md) | [Public backlog](./backlog.md)

Kocteau should not feel like another recommendation engine. The product promise is:

```text
Kocteau does not recommend music. Kocteau teaches people how to discover it.
```

The Knowledge Layer is the system that makes that promise real. It separates music facts from editorial judgment and gives Search enough structure to feel like exploration rather than a static results list.

## Product Boundaries

Use these names as working architecture, not necessarily user-facing labels:

| Layer | Role |
| --- | --- |
| Kocteau | Public music review, discovery, and taste expression product. |
| Search | Public exploration surface for artists, albums, tracks, and connected routes. |
| Studio | Maintainer-facing curation desk for starter picks, tags, candidates, and review queues. |
| Kura | Internal operating-system idea for curation. Do not expose this name until it earns product clarity. |

Search is not a catalog lookup. It asks for a starting point and lets the listener choose where to move next.

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

These are not objective music facts. They should come from Kocteau curation, reviews, starter picks, or trusted community behavior.

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

Discovery should not start from "what should I recommend?" It should start from:

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

## Search Discovery

Search should begin as a public exploration surface powered by existing catalog and product data:

- a track, album, or artist selected by the listener
- nearby, deeper, stranger, and serendipitous routes
- future artist and tag routes when entity depth is ready

Each search route should eventually show:

- a short definition
- starter picks
- reviewed tracks
- nearby tags
- directional route lanes
- human reviews that explain the sound

Do not build a large generic encyclopedia first. Start with the pages that help a listener find what to hear next.

Current implementation:

- `/search` accepts a listener-selected seed and turns catalog relationships into an interactive route.
- Starter picks are optional visual entry points, not the source of truth for discovery.
- Candidate generation, ranking, explanation, and personalization stay separate.
- There is no generative recommendation engine or separate agent runtime.

## Guidance Contract

The discovery layer may rerank catalog candidates and explain visible connections. It must not:

- invent genres as facts
- publish production metadata without review
- hide the basis of a recommendation
- act like a final music authority
- replace reviews or human taste

Every user-facing route should be explainable from at least one of:

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

This keeps today's product working while making Search routes more coherent and explainable.

After applying the cleanup migration, run:

```sql
-- supabase/scripts/maintenance/knowledge-layer-tag-cleanup-check.sql
```

Every returned row should have `ok = true`.
