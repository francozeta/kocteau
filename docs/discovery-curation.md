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

## Status Snapshot

This roadmap is intentionally phased. Current shipped or in-review work:

- Phase 1 signal contract and analytics validation are in place.
- Phase 2 recommendation health has a maintainer Studio surface and aggregate checks.
- Phase 3A contextual starter rails are in place through a surface/context contract.
- Phase 3B starter taxonomy work is in place for `era` and `format` signals.
- Phase 3C starter Studio workflow polish is in place with catalog filters, readiness labels, editorial notes, and safer archive confirmation.
- Phase 3D anti-mainstream Deezer candidate finder V0 is in place for related and deep-cut suggestions.
- Phase 4 editorial candidate queue V1 is in place for persisting curator decisions.

Phase 5 is the next maintainer phase. Feed tuning should start with a baseline snapshot before changing the recommendation RPC.

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

Status: shipped enough for the first discovery work. Keep expanding only when a real product question needs another signal.

Outcomes:

- maintainers can see feed load health
- recommendation fallback can be tracked
- starter pick conversion can be measured
- future ranking changes have evidence

### Phase 2: Recommendation Health

Add lightweight health checks before building a dashboard.

Status: shipped enough for maintainer use. Future work should improve interpretation, not expose raw analytics rows.

Phase 2 starts with a read-only SQL playbook for maintainers and a curator-only Studio health surface powered by safe aggregate RPCs. Do not expose raw `analytics_events` rows to the web app.

Useful checks:

- fallback rate by day
- action rate per recommendation reason
- starter impression to review conversion
- read depth per recommendation reason
- tag coverage across starter picks
- reviews with high read depth but low engagement

### Phase 3: Starter Studio V2 And Contextual Starter Rails

Improve `/studio/starter` as a quiet editorial tool for the official curator.

Status: shipped enough for the current starter curation loop. Future work should be narrow visual QA, candidate quality measurement, or measured rail diversity.

Phase 3A starts with the secondary starter rail: starter picks should not feel identical on every screen, and they should not block the main layout render. The rail can use a lightweight surface/context contract, such as `home`, `profile:{username}`, `track:{id}`, `review:{id}`, or `studio:health`, to request a stable daily editorial rotation from `get_starter_tracks_for_surface()`.

Priorities:

- contextual starter pick rotation by route surface
- client-loaded rail picks through `/api/starter/rail`
- reviewed-track filtering inside the starter RPC
- fuller `era` and `format` vocabularies for editorial coverage
- curator-side tag editing without leaving Studio
- faster tag assignment
- clearer pick status
- warnings for picks without signals
- coverage by tag kind
- confidence before archiving
- optional notes about why a pick is in the starter layer

Keep it editorial and focused. Do not turn it into a generic admin dashboard.

### Phase 3D: Anti-Mainstream Candidate Finder V0

Add a curator-only finder inside `/studio/starter` where Deezer proposes possible starter picks and Kocteau filters them through editorial rules.

Status: shipped for V0. The finder can suggest related and deep-cut candidates, while persistence is handled by the Phase 4 queue.

Principle:

```text
Deezer proposes -> Kocteau filters -> curator decides
```

V0 constraints:

- no new database tables
- no persistent dismissal queue
- no automatic starter pick creation
- no global chart ingestion
- no heavy ML
- no fake reviews or fake engagement

Candidate sources:

- related artists from an existing seed artist
- deep cuts from a known artist, where the artist can be famous but the selected track should be less obvious
- search queries shaped by undercovered tags or scenes
- future visual-color intent, once cover color signals are modeled

Each candidate should show:

- track identity and cover
- the source mode, such as `related seed` or `deep cut`
- an anti-mainstream tier
- a short editorial reason
- actions to select into the existing starter draft or skip locally

This phase should prove whether a human curator can use algorithmic suggestions without making Kocteau feel commercial or chart-driven.

### Phase 4: Editorial Candidates

Introduce `editorial_candidates` as a queue where the system proposes tracks that might deserve human review.

Status: shipped for V1 persistence. The first persistent version stores only curator-facing track candidates and decisions. It does not auto-promote candidates into starter picks.

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

V1 constraints:

- candidates remain curator-only
- approving still requires saving through the existing starter pick workflow
- dismissed candidates stay as decision history
- no public candidate pages
- no automated ranking changes until recommendation health can measure impact

### Phase 5: Feed Tuning

Tune `get_recommended_review_ids` only after Phase 1 and Phase 2 produce enough signal.

Status: next maintainer phase. Capture the baseline with `supabase/scripts/maintenance/feed-tuning-baseline-snapshot.sql` before changing the RPC.

Potential tuning areas:

- written reviews above rating-only entries
- diversity by author and entity
- better exploration controls
- clearer recommendation reason labels
- stronger editorial fallback when activity is sparse

First pass constraints:

- change one or two scoring hypotheses at a time
- preserve existing reason labels unless the UI and analytics contract are updated together
- keep sparse-data fallback useful for new users
- compare before/after snapshots rather than tuning from intuition

Known or mainstream music policy:

- Users are free to review familiar or popular music.
- Do not suppress a user because their taste includes known artists.
- Do not let known songs dominate curation just because recognition creates easy engagement.
- Treat a thoughtful review of a familiar song as useful reading material.
- Treat rating-only or low-context reviews of familiar songs as weak discovery material.
- For editorial starter picks, known artists should usually enter through deep cuts, contrast picks, or strong context rather than obvious hits.

### Phase 6: Visible Recommendation Surfaces

Make recommendations visible where users naturally ask for them: track pages, search, and review detail pages.

This phase responds to a product perception gap: Kocteau may have starter picks, feed ranking, and curator signals, but a new visitor can still ask "where are the recommendations?" if a track page only shows the selected track and reviews.

Track pages should start with a lightweight `More to hear` module:

- use local entity tags when available
- match against starter picks and reviewed entities with overlapping tags
- fall back to Deezer artist, album, or related metadata when local data is sparse
- show a short reason for every recommendation
- avoid pretending sparse data is personalized

This phase should also introduce a listener-facing candidate finder. The model mirrors Starter Studio, but the user job is different: a listener is not curating the starter catalog; they are asking Kocteau for a better next path from something they already like, read, saved, or searched.

The listener candidate finder should support seeds such as:

- the current track
- a reviewed track
- an artist name
- a user's saved or reviewed tracks when signed in
- a taste tag, scene, mood, era, or format
- a free-form search query from Explore

The first version should stay explainable:

- Deezer can propose raw candidates through search, artist, album, or related metadata.
- Kocteau should filter with local tags, starter picks, reviewed entities, editorial candidates, and anti-mainstream heuristics.
- Known artists are allowed, but the route should prefer deep cuts, influence paths, contrast picks, or less obvious neighboring tracks.
- Each recommendation needs a reason label that a listener can understand and analytics can measure.
- Signed-out users can browse public candidates. Signed-in users can get stronger seeds from reviews, saves, follows, and taste preferences.

The product contract is:

```text
External catalog proposes -> Kocteau filters -> listener decides
```

This keeps discovery human-led while still making the recommendation promise visible.

Search should become Kocteau-first:

- query local profiles, entities, reviewed tracks, and starter picks before external fallback
- support tracks, artists, albums, users, and future category/tag matches
- re-rank Deezer results by intent so exact artist matches beat unrelated title-only matches
- use external popularity as a tie-breaker rather than the main product decision

Review detail pages should support deeper interaction:

- review cards should open the review route from the readable card surface
- comments should feel anchored to the reviewed track and writer
- mobile should include a small social discovery path, such as writers or listeners near the review context

Constraints:

- keep V0 in the existing web and Supabase stack
- do not add embeddings, vector search, or a graph engine for this phase
- do not create fake recommendations, fake reviews, or fake activity
- keep explanation labels readable enough for analytics and future health checks

### Phase 6B: Community Curation Signals

Make Kocteau learn from intentional human actions before adding any AI layer.

This phase treats reviews, library intent, and future collections as curation material:

- library tracks: the listener kept a track close without needing to write a review immediately.
- saved reviews: the listener found another person's writing worth revisiting.
- collections: a person groups tracks with a human meaning, not just a playlist shape.
- collection tags and intent: the group explains why the tracks belong together.

The first implementation should stay simple:

1. Add a private `library` signal on track pages.
2. Expose that signal in a private `Library` surface.
3. Add public/private collections after the library intent model is stable.
4. Let collections carry optional tags and intent labels.
5. Derive track relationships from repeated co-curation, reviews, and explicit collection meaning.
6. Show lightweight `Why this?` explanations only after the underlying signal is real.

The AI posture is future-ready, not AI-dependent:

- Today, Kocteau can use SQL, tags, reviews, saves, follows, and collections.
- Later, an AI service can summarize collection intent, propose tags, or draft explanation copy.
- AI should never write directly to production recommendation tables without maintainer review.
- User-facing explanations should cite product signals, not hidden model confidence.

### Phase 7: Taste Graph

Add manual entity relationships before embeddings.

Possible relationship types:

- similar texture
- influence
- same scene
- contrast pick
- gateway from one sound to another

This can power track pages, Explore, and future recommendation explainability.

### Phase 8: Cover Visual Signals

Cover color can become a lightweight taste signal after starter curation proves useful.

The preferred model is hybrid:

- compute a dominant cover color and simple palette only when a track or album enters Kocteau
- store broad visual tags such as `red`, `black`, `white`, `pastel`, `dark`, or `high-contrast`
- let curators override or verify the result when it matters
- use visual color as a discovery hint, not as a replacement for taste tags or reviews

Do not index the whole Deezer catalog for color. Kocteau should only analyze music that enters the local editorial or review layer.

### Phase 9: Taste Atlas

Design a native Kocteau discovery surface that lets listeners move through taste relationships instead of only scrolling a feed or searching directly.

The first version should be a small, explainable atlas:

- starts from a track, artist, tag, mood, or curated starter pick
- shows nearby recommendations with a short reason
- supports directional feedback such as closer, stranger, softer, darker, deeper cut, or skip
- uses known artists as gateways to hidden gems instead of treating popularity as automatically bad
- learns from reviews, saves, follows, starter actions, and curator decisions as Kocteau grows

V0 should not require a large user-data corpus. It can start from editorial relationships, starter tags, entity tags, Deezer metadata, and curator-approved candidates. The interface should be honest about sparse data by framing recommendations as editorial paths, not as all-knowing personalization.

Engineering constraints:

- keep V0 in the existing web, Supabase, and TypeScript stack
- prefer readable SQL and typed query helpers over a new graph engine
- avoid Rust, vector search, or a separate worker until performance or quality measurements prove the need
- keep the graph explainable enough for maintainers to inspect why two entities are connected

This phase should wait until feed tuning has a baseline and the existing health checks can show whether discovery changes improve review creation, saves, and useful exploration.

### Future Research

These ideas are promising but should remain RFCs until the web core is healthier:

- artist profiles as lightweight living EPKs
- external links for Bandcamp, SoundCloud, YouTube, or Audiomack
- artist-as-curator flows
- review premieres
- native Kocteau tracks for music outside Deezer
- cover color as a discovery signal beyond starter picks
- Taste Atlas as an interactive relationship surface for discovery
- embeddings and vector search
- creator programs or public curator applications

## Contributor Guidance

Good contributor work:

- documentation updates
- event contract examples
- Explore copy and empty states
- UI polish for starter curation
- tests around anti-mainstream candidate scoring
- non-sensitive Deezer metadata mapping helpers
- query notes that help maintainers inspect health
- tests around analytics payload validation

Maintainer-led work:

- Supabase migrations
- RLS changes
- recommendation RPC changes
- analytics schema changes
- starter curator permissions
- persistent editorial candidate queues
- cover color schema and migration decisions
- editorial candidate approval logic

Future RFC work:

- native artist flows
- external music source strategy
- embeddings and vector search
- creator programs
