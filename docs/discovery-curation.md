# Kocteau Discovery And Curation Strategy

[Docs index](./README.md) | [MVP baseline](./mvp.md) | [Web roadmap](./web-roadmap.md) | [Backlog](./backlog.md) | [Operations](./operations.md)

Kocteau should help people discover music through human taste first, with lightweight systems that route that taste to the right listeners.

The guiding principle is:

```text
Amplify taste, not engagement.
```

This document gives maintainers and contributors a shared map for recommendation, analytics, editorial curation, and future discovery work. It is intentionally phased so the product can improve without turning into a heavy algorithm project too early.

## Current Baseline

Kocteau already has the core primitives for hybrid discovery:

- reviews
- ratings
- likes
- bookmarks
- comments
- follows
- notifications
- saved reviews
- `preference_tags`
- `user_preference_tags`
- `entity_preference_tags`
- `starter_tracks`
- `starter_track_tags`
- `analytics_events`
- the `get_recommended_review_ids` RPC
- the `get_starter_tracks` RPC
- the internal `/studio/starter` curation route

The next work should improve measurement, editorial workflow, and ranking confidence before introducing embeddings, vector search, or machine learning.

## Product Model

Discovery should work through three layers.

### 1. Sources

Content can enter discovery from:

- editorial starter picks
- editorial collections
- reviews
- likes
- bookmarks
- comments
- follows
- recently active entities
- underexposed tracks
- future editorial candidate queues

### 2. Canonical Taste Layer

Kocteau should treat its taste vocabulary as the source of meaning:

- `preference_tags`
- `user_preference_tags`
- `entity_preference_tags`
- `starter_track_tags`

Deezer is a metadata source. Kocteau defines taste meaning.

### 3. Ranking And Routing

Recommendation candidates should be scored from simple, inspectable ingredients:

- taste affinity
- social affinity
- editorial affinity
- recency
- review quality
- novelty
- exploration
- diversity penalties

The feed should mix familiar, trusted, curated, and unexpected content. Do not optimize only for clicks.

## Signal Contract

Analytics should remain small, first-party, and product-specific. Events should explain a user action or product state that can inform a real product decision.

Do not send email, IP address, user agent, or raw free-form review text in `analytics_events.metadata`.

### Event Naming

Use lowercase snake case:

```text
review_impression
review_open
review_read_50
review_read_90
entity_open
feed_loaded
recommendation_fallback
for_you_review_action
starter_impression
starter_open
starter_pass
starter_review_cta
starter_review_published
```

### Required Shape

Every event should include:

- `event_type`: stable event name
- `source`: product surface, such as `feed:for-you`, `feed:starter`, `track:page`, or `search:page`
- `metadata`: a small object with identifiers and non-sensitive counters

### Recommended Metadata

Use only fields that help answer a product question:

| Event | Suggested metadata | Product decision |
| --- | --- | --- |
| `feed_loaded` | `view`, `review_count`, `starter_count`, `has_cursor` | Is the feed loading enough material? |
| `recommendation_fallback` | `code`, `cursor` | Is For You healthy or falling back too often? |
| `review_impression` | `review_id`, `entity_id`, `reason`, `position` | Which recommendation reasons get surfaced? |
| `review_open` | `review_id`, `entity_id`, `reason`, `position` | Which surfaced reviews earn deeper reading? |
| `review_read_50` | `review_id`, `entity_id`, `reason` | Which reviews hold attention? |
| `review_read_90` | `review_id`, `entity_id`, `reason` | Which reviews are genuinely read? |
| `entity_open` | `entity_id`, `provider`, `provider_id`, `type` | Which tracks become discovery destinations? |
| `for_you_review_action` | `action`, `review_id`, `entity_id`, `reason` | Which feed actions should tune ranking? |
| `starter_impression` | `starter_track_id`, `provider_id`, `matched_tag_count`, `position` | Which editorial picks are shown? |
| `starter_pass` | `starter_track_id`, `provider_id`, `matched_tag_count` | Which editorial picks should be downranked or replaced? |
| `starter_open` | `starter_track_id`, `provider_id`, `matched_tag_count` | Which editorial picks become discovery destinations? |
| `starter_review_cta` | `starter_track_id`, `provider_id` | Which starter picks invite reviews? |
| `starter_review_published` | `starter_track_id`, `provider_id` | Which starter picks convert into reviews? |

### Signal Rules

- One event should answer one question.
- Prefer stable IDs over display text.
- Keep metadata under the existing database size limits.
- Use reason labels from the recommendation system when the event comes from For You.
- Do not create a new event if an existing event plus an `action` value can express the behavior clearly.
- Add event documentation before adding broad instrumentation.

## Phased Roadmap

### Phase 1: Measurement Foundation

Expand the analytics contract around For You, reviews, entities, and starter picks.

Outcomes:

- maintainers can see feed load health
- recommendation fallback can be tracked
- starter pick conversion can be measured
- future ranking changes have evidence

### Phase 2: Recommendation Health

Add lightweight health checks before building a dashboard.

Phase 2 starts with a read-only SQL playbook for maintainers and a curator-only Studio health surface powered by safe aggregate RPCs. Do not expose raw `analytics_events` rows to the web app.

Useful checks:

- fallback rate by day
- action rate per recommendation reason
- starter impression to review conversion
- read depth per recommendation reason
- tag coverage across starter picks
- reviews with high read depth but low engagement

### Phase 3: Starter Studio V2

Improve `/studio/starter` as a quiet editorial tool for the official curator.

Priorities:

- faster tag assignment
- clearer pick status
- warnings for picks without signals
- coverage by tag kind
- confidence before archiving
- optional notes about why a pick is in the starter layer

Keep it editorial and focused. Do not turn it into a generic admin dashboard.

### Phase 4: Editorial Candidates

Introduce `editorial_candidates` as a queue where the system proposes tracks that might deserve human review.

Candidate reasons can include:

- unusual review velocity
- bookmark growth
- strong read depth
- high interaction from trusted users
- emerging tag clusters
- undercovered taste areas

Workflow:

```text
signals -> candidate -> curator decision -> starter pick or dismissal
```

The algorithm discovers. Humans validate.

### Phase 5: Feed Tuning

Tune `get_recommended_review_ids` only after Phase 1 and Phase 2 produce enough signal.

Potential tuning areas:

- written reviews above rating-only entries
- diversity by author and entity
- better exploration controls
- clearer recommendation reason labels
- stronger editorial fallback when activity is sparse

### Phase 6: Taste Graph

Add manual entity relationships before embeddings.

Possible relationship types:

- similar texture
- influence
- same scene
- contrast pick
- gateway from one sound to another

This can power track pages, Explore, and future recommendation explainability.

### Future Research

These ideas are promising but should remain RFCs until the web core is healthier:

- artist profiles as lightweight living EPKs
- external links for Bandcamp, SoundCloud, YouTube, or Audiomack
- artist-as-curator flows
- review premieres
- native Kocteau tracks for music outside Deezer
- embeddings and vector search
- creator programs or public curator applications

## Contributor Guidance

Good contributor work:

- documentation updates
- event contract examples
- Explore copy and empty states
- UI polish for starter curation
- query notes that help maintainers inspect health
- tests around analytics payload validation

Maintainer-led work:

- Supabase migrations
- RLS changes
- recommendation RPC changes
- analytics schema changes
- starter curator permissions
- editorial candidate approval logic

Future RFC work:

- native artist flows
- external music source strategy
- embeddings and vector search
- creator programs
